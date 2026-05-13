import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BirthdayTaskService {
  private readonly logger = new Logger(BirthdayTaskService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async createBirthdayTasks(): Promise<void> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    this.logger.log(`Verificando aniversariantes do dia ${day}/${month}`);

    const contacts = await this.prisma.contact.findMany({
      where: {
        birthDate: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
        tenantId: true,
        ownerId: true,
      },
    });

    const birthdayContacts = contacts.filter((c) => {
      if (!c.birthDate) return false;
      const bd = new Date(c.birthDate);
      return bd.getMonth() + 1 === month && bd.getDate() === day;
    });

    if (birthdayContacts.length === 0) {
      this.logger.log('Nenhum aniversariante hoje.');
      return;
    }

    this.logger.log(`Criando tarefas de aniversário para ${birthdayContacts.length} contato(s)`);

    const dueDate = new Date(today);
    dueDate.setHours(9, 0, 0, 0);

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    for (const contact of birthdayContacts) {
      const title = `Enviar feliz aniversário para ${contact.name}`;

      const existing = await this.prisma.task.findFirst({
        where: {
          tenantId: contact.tenantId,
          contactId: contact.id,
          title: { equals: title, mode: 'insensitive' },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
      });

      if (existing) {
        this.logger.log(`Tarefa de aniversário já existe para ${contact.name}`);
        continue;
      }

      await this.prisma.task.create({
        data: {
          tenantId: contact.tenantId,
          assignedTo: contact.ownerId,
          contactId: contact.id,
          title,
          description: `Hoje é o aniversário de ${contact.name}! Envie uma mensagem de felicitações.`,
          dueDate,
        },
      });

      this.logger.log(`Tarefa de aniversário criada para ${contact.name}`);
    }
  }
}
