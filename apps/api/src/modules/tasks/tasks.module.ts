import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { BirthdayTaskService } from './birthday-task.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, BirthdayTaskService],
  exports: [TasksService],
})
export class TasksModule {}
