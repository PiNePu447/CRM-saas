import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
};

const USER_SELECT_WITH_RELATIONS = {
  ...USER_SELECT,
  manager: { select: { id: true, name: true, email: true } },
  sellers: { select: { id: true, name: true, email: true, role: true, isActive: true } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, requesterId: string, requesterRole: UserRole) {
    // MANAGER sees only themselves and their own sellers
    if (requesterRole === UserRole.MANAGER) {
      return this.prisma.user.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [{ id: requesterId }, { managerId: requesterId }],
        },
        select: USER_SELECT_WITH_RELATIONS,
        orderBy: { name: 'asc' },
      });
    }

    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: USER_SELECT_WITH_RELATIONS,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string, requesterId: string, requesterRole: UserRole) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: USER_SELECT_WITH_RELATIONS,
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    // MANAGER can only view themselves or their own sellers
    if (requesterRole === UserRole.MANAGER && user.id !== requesterId && user.managerId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }

  async invite(tenantId: string, requesterId: string, requesterRole: UserRole, dto: InviteUserDto) {
    // MANAGER can only create SELLER role
    if (requesterRole === UserRole.MANAGER && dto.role !== 'SELLER') {
      throw new ForbiddenException('Managers can only create users with SELLER role');
    }

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });

    if (existing) {
      if (existing.deletedAt) {
        const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);
        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            name: dto.name,
            role: dto.role,
            passwordHash,
            isActive: true,
            deletedAt: null,
            managerId: dto.managerId ?? (requesterRole === UserRole.MANAGER ? requesterId : null),
          },
          select: USER_SELECT_WITH_RELATIONS,
        });
      }
      throw new ConflictException('Email already in use in this tenant');
    }

    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);

    // If MANAGER is creating a SELLER, auto-assign to themselves unless managerId explicitly set
    const managerId =
      dto.role === 'SELLER'
        ? (dto.managerId ?? (requesterRole === UserRole.MANAGER ? requesterId : null))
        : null;

    // Validate managerId belongs to this tenant if provided
    if (managerId) {
      await this.assertManagerExists(managerId, tenantId);
    }

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
        managerId: managerId ?? undefined,
      },
      select: USER_SELECT_WITH_RELATIONS,
    });
  }

  async update(
    id: string,
    tenantId: string,
    requesterId: string,
    requesterRole: UserRole,
    dto: UpdateUserDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    // MANAGER can only edit their own sellers
    if (requesterRole === UserRole.MANAGER) {
      if (user.managerId !== requesterId && user.id !== requesterId) {
        throw new ForbiddenException('Managers can only edit their own sellers');
      }
      // MANAGER cannot change roles
      if (dto.role) {
        throw new ForbiddenException('Managers cannot change user roles');
      }
    }

    if (user.id === requesterId && dto.role && dto.role !== user.role) {
      throw new ForbiddenException('Cannot change your own role');
    }

    if (user.role === 'ADMIN' && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can modify other admins');
    }

    // Validate new managerId if provided
    if (dto.managerId) {
      await this.assertManagerExists(dto.managerId, tenantId);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.role && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...('managerId' in dto && { managerId: dto.managerId ?? null }),
      },
      select: USER_SELECT_WITH_RELATIONS,
    });
  }

  async remove(id: string, tenantId: string, requesterId: string, requesterRole: UserRole) {
    if (id === requesterId) throw new ForbiddenException('Cannot delete your own account');

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    // MANAGER can only remove their own sellers
    if (requesterRole === UserRole.MANAGER && user.managerId !== requesterId) {
      throw new ForbiddenException('Managers can only remove their own sellers');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, refreshToken: null, managerId: null },
    });
  }

  async assignSellerToManager(sellerId: string, managerId: string | null, tenantId: string) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, tenantId, deletedAt: null, role: UserRole.SELLER },
    });
    if (!seller) throw new NotFoundException(`Seller ${sellerId} not found`);

    if (managerId) {
      await this.assertManagerExists(managerId, tenantId);
    }

    return this.prisma.user.update({
      where: { id: sellerId },
      data: { managerId: managerId ?? null },
      select: USER_SELECT_WITH_RELATIONS,
    });
  }

  private async assertManagerExists(managerId: string, tenantId: string) {
    const manager = await this.prisma.user.findFirst({
      where: { id: managerId, tenantId, deletedAt: null, role: UserRole.MANAGER },
    });
    if (!manager) throw new NotFoundException(`Manager ${managerId} not found`);
  }
}
