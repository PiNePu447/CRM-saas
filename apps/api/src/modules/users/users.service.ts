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
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async invite(tenantId: string, dto: InviteUserDto) {
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
          },
          select: USER_SELECT,
        });
      }
      throw new ConflictException('Email already in use in this tenant');
    }

    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, tenantId: string, requesterId: string, requesterRole: UserRole, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (user.id === requesterId && dto.role && dto.role !== user.role) {
      throw new ForbiddenException('Cannot change your own role');
    }

    if (user.role === 'ADMIN' && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can modify other admins');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async remove(id: string, tenantId: string, requesterId: string) {
    if (id === requesterId) throw new ForbiddenException('Cannot delete your own account');

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, refreshToken: null },
    });
  }
}
