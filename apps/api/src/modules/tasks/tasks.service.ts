import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { PartialType } from '@nestjs/mapped-types';

class UpdateTaskDto extends PartialType(CreateTaskDto) {}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private buildOwnerFilter(userId: string, userRole: string) {
    if (userRole === UserRole.SELLER) return { assignedTo: userId };
    return {};
  }

  async findAll(
    tenantId: string,
    userId: string,
    userRole: string,
    options: {
      contactId?: string;
      dealId?: string;
      assignedTo?: string;
      dueBefore?: string;
      dueAfter?: string;
      completed?: boolean;
    } = {},
  ) {
    const ownerFilter = this.buildOwnerFilter(userId, userRole);

    return this.prisma.task.findMany({
      where: {
        tenantId,
        ...ownerFilter,
        ...(options.contactId && { contactId: options.contactId }),
        ...(options.dealId && { dealId: options.dealId }),
        ...(options.assignedTo && { assignedTo: options.assignedTo }),
        ...(options.completed === true && { completedAt: { not: null } }),
        ...(options.completed === false && { completedAt: null }),
        ...(options.dueBefore && { dueDate: { lte: new Date(options.dueBefore) } }),
        ...(options.dueAfter && { dueDate: { gte: new Date(options.dueAfter) } }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getCalendar(
    tenantId: string,
    userId: string,
    userRole: string,
    start: string,
    end: string,
  ) {
    const ownerFilter = this.buildOwnerFilter(userId, userRole);

    return this.prisma.task.findMany({
      where: {
        tenantId,
        ...ownerFilter,
        dueDate: { gte: new Date(start), lte: new Date(end) },
      },
      include: {
        assignee: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        assignee: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(tenantId: string, userId: string, dto: CreateTaskDto) {
    const assignedTo = dto.assignedTo ?? userId;

    const duplicate = await this.prisma.task.findFirst({
      where: {
        tenantId,
        assignedTo,
        title: { equals: dto.title, mode: 'insensitive' },
        completedAt: null,
        ...(dto.dueDate && {
          dueDate: new Date(dto.dueDate),
        }),
      },
    });
    if (duplicate) {
      throw new ConflictException(`Já existe uma tarefa com o título "${dto.title}" para este usuário`);
    }

    const task = await this.prisma.task.create({
      data: {
        tenantId,
        assignedTo,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        contactId: dto.contactId,
        dealId: dto.dealId,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    if (dto.contactId) {
      await this.prisma.activity.create({
        data: {
          tenantId,
          contactId: dto.contactId,
          dealId: dto.dealId,
          userId,
          type: ActivityType.TASK_CREATED,
          content: { taskId: task.id, title: task.title, dueDate: task.dueDate },
        },
      });
    }

    return task;
  }

  async update(id: string, tenantId: string, dto: UpdateTaskDto) {
    await this.findOne(id, tenantId);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
      },
    });
  }

  async complete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.task.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }

  async reopen(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.task.update({ where: { id }, data: { completedAt: null } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.task.delete({ where: { id } });
  }
}
