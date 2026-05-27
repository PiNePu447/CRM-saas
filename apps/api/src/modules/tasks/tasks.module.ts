import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { BirthdayTaskService } from './birthday-task.service';
import { DueDateNotificationService } from './due-date-notification.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TasksController],
  providers: [TasksService, BirthdayTaskService, DueDateNotificationService],
  exports: [TasksService],
})
export class TasksModule {}
