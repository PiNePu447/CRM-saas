import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDealDto as BaseDealDto } from './dto/create-deal.dto';

class UpdateDealDto extends PartialType(BaseDealDto) {}

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // PIPELINES
  // =====================

  async findAllPipelines(tenantId: string) {
    return this.prisma.pipeline.findMany({
      where: { tenantId },
      include: {
        stages: { orderBy: { position: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPipeline(tenantId: string, dto: CreatePipelineDto) {
    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.create({
      data: {
        tenantId,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        ...(dto.stages?.length && {
          stages: {
            create: dto.stages.map((s) => ({
              name: s.name,
              position: s.position,
              probabilityDefault: s.probabilityDefault ?? 50,
              color: s.color ?? '#6B7280',
            })),
          },
        }),
      },
      include: { stages: { orderBy: { position: 'asc' } } },
    });
  }

  async seedDefaultPipeline(tenantId: string) {
    const existing = await this.prisma.pipeline.findFirst({ where: { tenantId } });
    if (existing) return;

    return this.createPipeline(tenantId, {
      name: 'Vendas',
      isDefault: true,
      stages: [
        { name: 'Prospecção', position: 0, probabilityDefault: 10, color: '#6B7280' },
        { name: 'Qualificação', position: 1, probabilityDefault: 25, color: '#3B82F6' },
        { name: 'Proposta', position: 2, probabilityDefault: 50, color: '#F59E0B' },
        { name: 'Negociação', position: 3, probabilityDefault: 75, color: '#8B5CF6' },
        { name: 'Ganho', position: 4, probabilityDefault: 100, color: '#10B981' },
        { name: 'Perdido', position: 5, probabilityDefault: 0, color: '#EF4444' },
      ],
    });
  }

  // =====================
  // DEALS
  // =====================

  private buildOwnerFilter(userId: string, userRole: string) {
    if (userRole === UserRole.SELLER) return { ownerId: userId };
    return {};
  }

  async findAll(
    tenantId: string,
    userId: string,
    userRole: string,
    pipelineId?: string,
    stageId?: string,
  ) {
    const ownerFilter = this.buildOwnerFilter(userId, userRole);

    return this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...ownerFilter,
        ...(pipelineId && { pipelineId }),
        ...(stageId && { stageId }),
      },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true } },
        stage: true,
        pipeline: { select: { id: true, name: true } },
      },
      orderBy: [{ stageId: 'asc' }, { position: 'asc' }],
    });
  }

  async getKanban(tenantId: string, userId: string, userRole: string, pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, tenantId },
      include: { stages: { orderBy: { position: 'asc' } } },
    });

    if (!pipeline) throw new NotFoundException(`Pipeline ${pipelineId} not found`);

    const ownerFilter = this.buildOwnerFilter(userId, userRole);

    const deals = await this.prisma.deal.findMany({
      where: { tenantId, pipelineId, deletedAt: null, ...ownerFilter },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { position: 'asc' },
    });

    const stagesWithDeals = pipeline.stages.map((stage) => ({
      ...stage,
      deals: deals.filter((d) => d.stageId === stage.id),
      totalValue: deals
        .filter((d) => d.stageId === stage.id)
        .reduce((sum, d) => sum + Number(d.value ?? 0), 0),
    }));

    return { pipeline: { id: pipeline.id, name: pipeline.name }, stages: stagesWithDeals };
  }

  async findOne(id: string, tenantId: string, userId: string, userRole: string) {
    const ownerFilter = this.buildOwnerFilter(userId, userRole);

    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId, deletedAt: null, ...ownerFilter },
      include: {
        contact: true,
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        pipeline: { select: { id: true, name: true } },
        tasks: {
          where: { completedAt: null },
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { dueDate: 'asc' },
        },
        activities: {
          take: 10,
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) throw new NotFoundException(`Deal ${id} not found`);
    return deal;
  }

  async create(tenantId: string, userId: string, userRole: string, dto: CreateDealDto) {
    const ownerId = dto.ownerId && userRole !== UserRole.SELLER ? dto.ownerId : userId;

    const lastDeal = await this.prisma.deal.findFirst({
      where: { tenantId, stageId: dto.stageId, deletedAt: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (lastDeal?.position ?? 0) + 1;

    return this.prisma.deal.create({
      data: {
        tenantId,
        ownerId,
        contactId: dto.contactId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        title: dto.title,
        value: dto.value,
        probability: dto.probability ?? 50,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        position,
      },
      include: {
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        stage: true,
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
    dto: UpdateDealDto,
  ) {
    await this.assertCanModify(id, tenantId, userId, userRole);

    return this.prisma.deal.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.expectedCloseDate && { expectedCloseDate: new Date(dto.expectedCloseDate) }),
      },
      include: {
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        stage: true,
      },
    });
  }

  async move(
    id: string,
    tenantId: string,
    userId: string,
    userRole: string,
    dto: MoveDealDto,
  ) {
    const deal = await this.assertCanModify(id, tenantId, userId, userRole);

    const previousStageId = deal.stageId;
    const isClosing = dto.isWon !== undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.deal.update({
        where: { id },
        data: {
          stageId: dto.stageId,
          position: dto.position,
          ...(isClosing && {
            isWon: dto.isWon,
            closedAt: new Date(),
            closedReason: dto.closedReason,
          }),
        },
        include: {
          stage: true,
          contact: { select: { id: true, name: true } },
        },
      });

      if (previousStageId !== dto.stageId) {
        const previousStage = await tx.pipelineStage.findUnique({ where: { id: previousStageId } });
        const newStage = await tx.pipelineStage.findUnique({ where: { id: dto.stageId } });

        await tx.activity.create({
          data: {
            tenantId,
            contactId: deal.contactId,
            dealId: id,
            userId,
            type: ActivityType.DEAL_MOVED,
            content: {
              from: { id: previousStageId, name: previousStage?.name },
              to: { id: dto.stageId, name: newStage?.name },
              isWon: dto.isWon,
              closedReason: dto.closedReason,
            },
          },
        });
      }

      return result;
    });

    this.rebalancePositionsIfNeeded(tenantId, dto.stageId);

    return updated;
  }

  async remove(id: string, tenantId: string, userId: string, userRole: string) {
    await this.assertCanModify(id, tenantId, userId, userRole);
    await this.prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async assertCanModify(id: string, tenantId: string, userId: string, userRole: string) {
    const ownerFilter = this.buildOwnerFilter(userId, userRole);
    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId, deletedAt: null, ...ownerFilter },
    });
    if (!deal) throw new NotFoundException(`Deal ${id} not found`);
    return deal;
  }

  /**
   * Rebalance fractional positions when gaps become too small.
   * Runs fire-and-forget, no need to await.
   */
  private rebalancePositionsIfNeeded(tenantId: string, stageId: string) {
    this.prisma.deal
      .findMany({
        where: { tenantId, stageId, deletedAt: null },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      })
      .then(async (deals) => {
        const needsRebalance = deals.some((d, i) =>
          i > 0 ? d.position - deals[i - 1].position < 0.001 : false,
        );

        if (needsRebalance) {
          await Promise.all(
            deals.map((d, i) =>
              this.prisma.deal.update({ where: { id: d.id }, data: { position: i + 1 } }),
            ),
          );
        }
      })
      .catch(() => null);
  }
}
