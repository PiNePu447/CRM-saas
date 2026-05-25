import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ContactsService } from '../../core/services/contacts.service';
import { DealsService } from '../../core/services/deals.service';
import { TasksService } from '../../core/services/tasks.service';
import { AuthService } from '../../core/services/auth.service';
import { UsersService, TenantUser } from '../../core/services/users.service';
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

  users: TenantUser[] = [];
  selectedOwnerId = '';

  constructor(
    private readonly contactsService: ContactsService,
    private readonly dealsService: DealsService,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
    readonly authService: AuthService,
  ) {}

  get canFilter(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  ngOnInit(): void {
    if (this.canFilter) {
      this.usersService.list().subscribe({
        next: (users) => (this.users = users.filter((u) => u.isActive)),
      });
    }
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ownerId = this.selectedOwnerId || undefined;

    forkJoin({
      contacts: this.contactsService.list({ limit: 1, ownerId }),
      deals: this.dealsService.list(undefined, undefined, ownerId),
      tasks: this.tasksService.list({ completed: false, assignedTo: ownerId }),
      upcomingTasks: this.tasksService.list({
        completed: false,
        assignedTo: ownerId,
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

  onOwnerChange(ownerId: string): void {
    this.selectedOwnerId = ownerId;
    this.loadStats();
  }

  formatCurrency(value?: number): string {
    if (!value) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
