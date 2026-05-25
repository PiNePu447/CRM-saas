import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DealsService } from './deals.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import {
  CreateStageInPipelineDto,
  ReorderStagesDto,
  UpdatePipelineDto,
  UpdateStageDto,
} from './dto/update-pipeline.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // =====================
  // PIPELINES
  // =====================

  @Get('pipelines')
  @ApiOperation({ summary: 'List all pipelines with stages' })
  findAllPipelines(@CurrentUser() user: CurrentUserData) {
    return this.dealsService.findAllPipelines(user.tenantId);
  }

  @Post('pipelines')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new pipeline with stages' })
  createPipeline(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePipelineDto) {
    return this.dealsService.createPipeline(user.tenantId, dto);
  }

  @Patch('pipelines/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update pipeline name or default status' })
  updatePipeline(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.dealsService.updatePipeline(user.tenantId, id, dto);
  }

  @Delete('pipelines/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pipeline (only if it has no deals)' })
  deletePipeline(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.dealsService.deletePipeline(user.tenantId, id);
  }

  @Post('pipelines/:id/stages')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a new stage to a pipeline' })
  createStage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateStageInPipelineDto,
  ) {
    return this.dealsService.createStage(user.tenantId, id, dto);
  }

  @Patch('pipelines/:id/stages/reorder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reorder stages within a pipeline' })
  reorderStages(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.dealsService.reorderStages(user.tenantId, id, dto);
  }

  @Patch('pipelines/:id/stages/:stageId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a stage (name, color, probability)' })
  updateStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateStageDto,
  ) {
    return this.dealsService.updateStage(user.tenantId, id, stageId, dto);
  }

  @Delete('pipelines/:id/stages/:stageId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stage (only if it has no deals)' })
  deleteStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.dealsService.deleteStage(user.tenantId, id, stageId);
  }

  // =====================
  // KANBAN VIEW
  // =====================

  @Get('kanban/:pipelineId')
  @ApiOperation({ summary: 'Get Kanban board - stages with deals grouped' })
  @ApiQuery({ name: 'ownerId', required: false })
  getKanban(
    @Param('pipelineId') pipelineId: string,
    @CurrentUser() user: CurrentUserData,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.dealsService.getKanban(user.tenantId, user.sub, user.role, pipelineId, ownerId);
  }

  // =====================
  // DEALS CRUD
  // =====================

  @Get()
  @ApiOperation({ summary: 'List all deals (scoped by role)' })
  @ApiQuery({ name: 'pipelineId', required: false })
  @ApiQuery({ name: 'stageId', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.dealsService.findAll(user.tenantId, user.sub, user.role, pipelineId, stageId, ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal with tasks and recent activities' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.dealsService.findOne(id, user.tenantId, user.sub, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateDealDto) {
    return this.dealsService.create(user.tenantId, user.sub, user.role, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deal details' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: Partial<CreateDealDto>,
  ) {
    return this.dealsService.update(id, user.tenantId, user.sub, user.role, dto);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move deal to a different stage (Kanban drag-and-drop)' })
  move(@Param('id') id: string, @CurrentUser() user: CurrentUserData, @Body() dto: MoveDealDto) {
    return this.dealsService.move(id, user.tenantId, user.sub, user.role, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a deal' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.dealsService.remove(id, user.tenantId, user.sub, user.role);
  }
}
