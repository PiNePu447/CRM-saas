import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null, isActive: true } },
            contacts: { where: { deletedAt: null } },
            deals: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id },
      include: {
        users: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            contacts: { where: { deletedAt: null } },
            deals: { where: { deletedAt: null } },
            companies: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async createTenant(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Tenant slug already in use');

    const emailInUse = await this.prisma.user.findFirst({ where: { email: dto.adminEmail } });
    if (emailInUse) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        settings: (dto.settings as object) ?? {},
        users: {
          create: {
            email: dto.adminEmail,
            passwordHash,
            name: dto.adminName,
            role: UserRole.ADMIN,
          },
        },
      },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    await this.assertTenantExists(id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.settings && { settings: dto.settings as object }),
        ...(dto.active === false ? { deletedAt: new Date() } : {}),
        ...(dto.active === true ? { deletedAt: null } : {}),
      },
    });
  }

  async deleteTenant(id: string) {
    await this.assertTenantExists(id);
    await this.prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createSuperAdmin(tenantId: string, dto: CreateSuperAdminDto) {
    await this.assertTenantExists(tenantId);

    const emailInUse = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (emailInUse) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: UserRole.ADMIN,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  private async assertTenantExists(id: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
  }
}
