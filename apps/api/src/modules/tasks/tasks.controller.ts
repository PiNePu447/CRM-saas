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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with filters (scoped by role)' })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'dealId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'completed', required: false, type: Boolean })
  @ApiQuery({ name: 'dueBefore', required: false })
  @ApiQuery({ name: 'dueAfter', required: false })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('contactId') contactId?: string,
    @Query('dealId') dealId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('completed') completed?: string,
    @Query('dueBefore') dueBefore?: string,
    @Query('dueAfter') dueAfter?: string,
  ) {
    const completedBool = completed === 'true' ? true : completed === 'false' ? false : undefined;
    return this.tasksService.findAll(user.tenantId, user.sub, user.role, {
      contactId,
      dealId,
      assignedTo,
      dueBefore,
      dueAfter,
      completed: completedBool,
    });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get tasks in a date range for calendar view' })
  @ApiQuery({ name: 'start', required: true, example: '2026-05-01' })
  @ApiQuery({ name: 'end', required: true, example: '2026-05-31' })
  getCalendar(
    @CurrentUser() user: CurrentUserData,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.tasksService.getCalendar(user.tenantId, user.sub, user.role, start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.findOne(id, user.tenantId, user.sub, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: Partial<CreateTaskDto>,
  ) {
    return this.tasksService.update(id, user.tenantId, user.sub, user.role, dto);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a task as completed' })
  complete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.complete(id, user.tenantId, user.sub, user.role);
  }

  @Patch(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen a completed task' })
  reopen(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.reopen(id, user.tenantId, user.sub, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.tasksService.remove(id, user.tenantId, user.sub, user.role);
  }
}
