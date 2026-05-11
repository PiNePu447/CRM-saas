import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

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

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

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
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contacts: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, status: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { contacts: true } },
      },
    });

    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async create(tenantId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: { ...dto, tenantId, customFields: (dto.customFields as object) ?? {} },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateCompanyDto) {
    await this.assertExists(id, tenantId);
    return this.prisma.company.update({
      where: { id },
      data: { ...dto, ...(dto.customFields && { customFields: dto.customFields as object }) },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.assertExists(id, tenantId);
    await this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async assertExists(id: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
  }
}
