import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DueDateNotificationService {
  private readonly logger = new Logger(DueDateNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDueDateNotifications(): Promise<void> {
    this.logger.log('Starting due date notifications check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      // Find all incomplete tasks due today
      const tasksDueToday = await this.prisma.task.findMany({
        where: {
          completedAt: null,
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      });

      this.logger.log(`Found ${tasksDueToday.length} tasks due today`);

      for (const task of tasksDueToday) {
        // Check if notification already sent today
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            tenantId: task.tenantId,
            userId: task.assignedTo,
            type: 'TASK_DUE_TODAY',
            data: {
              path: ['taskId'],
              equals: task.id,
            },
            createdAt: {
              gte: today,
            },
          },
        });

        if (!existingNotification) {
          await this.notificationsService.create(task.tenantId, {
            userId: task.assignedTo,
            type: 'TASK_DUE_TODAY',
            title: 'Tarefa vence hoje',
            message: `A tarefa "${task.title}" vence hoje`,
            data: { taskId: task.id, taskTitle: task.title, dueDate: task.dueDate },
          });

          this.logger.log(`Sent due date notification for task ${task.id} to user ${task.assignedTo}`);
        }
      }

      this.logger.log('Due date notifications check completed');
    } catch (error) {
      this.logger.error('Error sending due date notifications:', error);
    }
  }
}
