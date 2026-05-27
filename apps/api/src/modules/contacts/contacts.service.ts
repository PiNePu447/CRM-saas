import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildOwnershipFilter(userId: string, userRole: string) {
    if (userRole === UserRole.SELLER) return { ownerId: userId };
    if (userRole === UserRole.MANAGER) return {};
    return {};
  }

  async findAll(tenantId: string, userId: string, userRole: string, dto: ListContactsDto) {
    const { page = 1, limit = 25, search, status, ownerId, companyId, tagId } = dto;
    const skip = (page - 1) * limit;

    const ownerFilter = this.buildOwnershipFilter(userId, userRole);

    // SELLER ownership filter always takes precedence; ignore ownerId query param for SELLER
    const resolvedOwnerFilter =
      userRole === UserRole.SELLER
        ? ownerFilter
        : { ...ownerFilter, ...(ownerId && { ownerId }) };

    const where = {
      tenantId,
      deletedAt: null,
      ...resolvedOwnerFilter,
      ...(status && { status }),
      ...(companyId && { companyId }),
      ...(tagId && { tags: { some: { tagId } } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          _count: { select: { deals: true, activities: true } },
        },
      }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string, userId: string, userRole: string) {
    const ownerFilter = this.buildOwnershipFilter(userId, userRole);

    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null, ...ownerFilter },
      include: {
        company: {
          include: { owner: { select: { id: true, name: true, email: true } } },
        },
        owner: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        deals: {
          where: { deletedAt: null },
          include: {
            stage: true,
            pipeline: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          where: { completedAt: null },
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async create(tenantId: string, userId: string, userRole: string, dto: CreateContactDto) {
    const ownerId = dto.ownerId && userRole !== UserRole.SELLER ? dto.ownerId : userId;
    const { tagIds, birthDate, ...data } = dto;

    // SELLER can only create contacts for companies assigned to them
    if (userRole === UserRole.SELLER && dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: dto.companyId, tenantId, deletedAt: null },
      });
      if (!company) throw new NotFoundException(`Company ${dto.companyId} not found`);
      if (company.ownerId !== userId) {
        throw new ForbiddenException('Sellers can only add contacts to their own companies');
      }
    }

    if (dto.email) {
      const existing = await this.prisma.contact.findFirst({
        where: { tenantId, email: dto.email, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(`Já existe um contato com o email "${dto.email}"`);
      }
    }

    const existingByName = await this.prisma.contact.findFirst({
      where: { tenantId, name: { equals: dto.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (existingByName) {
      throw new ConflictException(`Já existe um contato com o nome "${dto.name}"`);
    }

    return this.prisma.contact.create({
      data: {
        ...data,
        tenantId,
        ownerId,
        customFields: (data.customFields as object) ?? {},
        ...(birthDate && { birthDate: new Date(birthDate + 'T12:00:00Z') }),
        ...(tagIds?.length && {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
    dto: UpdateContactDto,
  ) {
    await this.assertCanModify(id, tenantId, userId, userRole);

    if (dto.email) {
      const existing = await this.prisma.contact.findFirst({
        where: { tenantId, email: dto.email, deletedAt: null, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Já existe um contato com o email "${dto.email}"`);
      }
    }

    const { tagIds, birthDate, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.contactTag.deleteMany({ where: { contactId: id } });
        if (tagIds.length > 0) {
          await tx.contactTag.createMany({
            data: tagIds.map((tagId) => ({ contactId: id, tagId })),
          });
        }
      }

      return tx.contact.update({
        where: { id },
        data: {
          ...data,
          ...(data.customFields && { customFields: data.customFields as object }),
          ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate + 'T12:00:00Z') : null }),
        },
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      });
    });
  }

  async remove(id: string, tenantId: string, userId: string, userRole: string) {
    await this.assertCanModify(id, tenantId, userId, userRole);
    await this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async gdprDelete(id: string, tenantId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);

    await this.prisma.contact.update({
      where: { id },
      data: {
        name: '[DELETED]',
        email: null,
        phone: null,
        customFields: {},
        deletedAt: new Date(),
      },
    });
  }

  async getTimeline(
    contactId: string,
    tenantId: string,
    userId: string,
    userRole: string,
    cursor?: string,
    limit = 25,
  ) {
    const ownerFilter = this.buildOwnershipFilter(userId, userRole);
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId, deletedAt: null, ...ownerFilter },
    });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);

    const activities = await this.prisma.activity.findMany({
      where: {
        tenantId,
        contactId,
        ...(cursor && { id: { lt: cursor } }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { data: items, nextCursor };
  }

  async createActivity(
    contactId: string,
    tenantId: string,
    userId: string,
    userRole: string,
    dto: CreateActivityDto,
  ) {
    await this.assertCanModify(contactId, tenantId, userId, userRole);

    return this.prisma.activity.create({
      data: {
        tenantId,
        contactId,
        userId,
        type: dto.type,
        content: dto.content as object,
        ...(dto.dealId && { dealId: dto.dealId }),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  private async assertCanModify(id: string, tenantId: string, userId: string, userRole: string) {
    const ownerFilter = this.buildOwnershipFilter(userId, userRole);
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null, ...ownerFilter },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
  }
}
