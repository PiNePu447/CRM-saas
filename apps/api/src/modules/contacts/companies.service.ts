import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CompanyStatus } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'acmecorp.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '51-200' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Seller (owner) user ID to assign this company to' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

const OWNER_SELECT = { id: true, name: true, email: true };

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    return this.prisma.company.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      include: {
        owner: { select: OWNER_SELECT },
        _count: { select: { contacts: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        owner: { select: OWNER_SELECT },
        contacts: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, status: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { contacts: { where: { deletedAt: null } } } },
      },
    });

    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async create(tenantId: string, userId: string, userRole: UserRole, dto: CreateCompanyDto) {
    let ownerId = dto.ownerId ?? null;

    // SELLER can only create companies assigned to themselves
    if (userRole === UserRole.SELLER) {
      ownerId = userId;
    } else if (ownerId) {
      await this.assertSellerExists(ownerId, tenantId);
    }

    return this.prisma.company.create({
      data: {
        ...dto,
        ownerId,
        tenantId,
        customFields: (dto.customFields as object) ?? {},
      },
      include: { owner: { select: OWNER_SELECT } },
    });
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateCompanyDto,
  ) {
    const company = await this.assertExists(id, tenantId);

    // SELLER can only update companies they own
    if (userRole === UserRole.SELLER && company.ownerId !== userId) {
      throw new ForbiddenException('Sellers can only update their own companies');
    }

    if (dto.ownerId) {
      await this.assertSellerExists(dto.ownerId, tenantId);
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.customFields && { customFields: dto.customFields as object }),
      },
      include: { owner: { select: OWNER_SELECT } },
    });
  }

  async assignOwner(
    id: string,
    tenantId: string,
    requesterId: string,
    requesterRole: UserRole,
    ownerId: string | null,
  ) {
    await this.assertExists(id, tenantId);

    if (ownerId) {
      await this.assertSellerExists(ownerId, tenantId);
    }

    return this.prisma.company.update({
      where: { id },
      data: { ownerId: ownerId ?? null },
      include: { owner: { select: OWNER_SELECT } },
    });
  }

  async remove(id: string, tenantId: string, userId: string, userRole: UserRole) {
    const company = await this.assertExists(id, tenantId);

    if (userRole === UserRole.SELLER && company.ownerId !== userId) {
      throw new ForbiddenException('Sellers can only delete their own companies');
    }

    await this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async assertExists(id: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  private async assertSellerExists(sellerId: string, tenantId: string) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, tenantId, deletedAt: null },
    });
    if (!seller) throw new NotFoundException(`User ${sellerId} not found`);
  }
}
