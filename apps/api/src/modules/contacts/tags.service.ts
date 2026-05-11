import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'VIP' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.tag.findMany({
      where: { tenantId },
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateTagDto) {
    const existing = await this.prisma.tag.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) throw new ConflictException('Tag name already exists');

    return this.prisma.tag.create({ data: { tenantId, ...dto } });
  }

  async remove(id: string, tenantId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException(`Tag ${id} not found`);
    await this.prisma.tag.delete({ where: { id } });
  }
}
