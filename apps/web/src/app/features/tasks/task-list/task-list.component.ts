import { Component, OnInit } from '@angular/core';
import { TasksService } from '../../../core/services/tasks.service';
import { Task } from '../../../core/models/task.models';

@Component({ standalone: false,
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  loading = false;
  filterCompleted: boolean | undefined = false;
  view: 'list' | 'calendar' = 'list';
  today = new Date();

  calendarDays: { date: Date; tasks: Task[] }[] = [];
  calendarMonth: Date = new Date();

  showTaskForm = false;
  editingTask: Task | null = null;

  constructor(private readonly tasksService: TasksService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.tasksService.list({ completed: this.filterCompleted }).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadCalendar(): void {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    this.loading = true;
    this.tasksService.getCalendar(start, end).subscribe({
      next: (tasks) => {
        this.buildCalendar(year, month, tasks);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  buildCalendar(year: number, month: number, tasks: Task[]): void {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        date,
        tasks: tasks.filter((t) => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          return d.getFullYear() === year && d.getMonth() === month && d.getDate() === i + 1;
        }),
      };
    });
  }

  switchView(view: 'list' | 'calendar'): void {
    this.view = view;
    if (view === 'calendar') this.loadCalendar();
    else this.loadTasks();
  }

  prevMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() - 1,
      1,
    );
    this.loadCalendar();
  }

  nextMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + 1,
      1,
    );
    this.loadCalendar();
  }

  completeTask(task: Task): void {
    this.tasksService.complete(task.id).subscribe({
      next: (updated) => {
        const idx = this.tasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) this.tasks[idx] = updated;
        if (this.filterCompleted === false) {
          this.tasks = this.tasks.filter((t) => !t.completedAt);
        }
      },
    });
  }

  openNewTask(): void {
    this.editingTask = null;
    this.showTaskForm = true;
  }

  openEditTask(task: Task): void {
    this.editingTask = task;
    this.showTaskForm = true;
  }

  onTaskSaved(task: Task): void {
    this.showTaskForm = false;
    this.editingTask = null;
    this.loadTasks();
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  deleteTask(task: Task): void {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    this.tasksService.delete(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
      },
    });
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.completedAt) return false;
    return new Date(task.dueDate) < new Date();
  }
}

