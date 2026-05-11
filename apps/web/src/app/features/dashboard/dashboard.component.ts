import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ContactsService } from '../../core/services/contacts.service';
import { DealsService } from '../../core/services/deals.service';
import { TasksService } from '../../core/services/tasks.service';
import { AuthService } from '../../core/services/auth.service';
import { Task } from '../../core/models/task.models';
import { Deal } from '../../core/models/deal.models';

@Component({ standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  loading = true;
  today = new Date();
  stats = { totalContacts: 0, openDeals: 0, pendingTasks: 0, wonDeals: 0 };
  recentDeals: Deal[] = [];
  upcomingTasks: Task[] = [];

  constructor(
    private readonly contactsService: ContactsService,
    private readonly dealsService: DealsService,
    private readonly tasksService: TasksService,
    readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    forkJoin({
      contacts: this.contactsService.list({ limit: 1 }),
      deals: this.dealsService.list(),
      tasks: this.tasksService.list({ completed: false }),
      upcomingTasks: this.tasksService.list({
        completed: false,
        dueAfter: today.toISOString(),
        dueBefore: nextWeek.toISOString(),
      }),
    }).subscribe({
      next: ({ contacts, deals, tasks, upcomingTasks }) => {
        this.stats.totalContacts = contacts.meta.total;
        this.stats.openDeals = deals.filter((d) => !d.closedAt).length;
        this.stats.pendingTasks = tasks.length;
        this.stats.wonDeals = deals.filter((d) => d.isWon === true).length;
        this.recentDeals = deals.slice(0, 5);
        this.upcomingTasks = upcomingTasks.slice(0, 5);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  formatCurrency(value?: number): string {
    if (!value) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}

