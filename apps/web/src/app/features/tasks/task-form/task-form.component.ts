import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TasksService } from '../../../core/services/tasks.service';
import { ContactsService } from '../../../core/services/contacts.service';
import { TeamService, TeamUser } from '../../../core/services/team.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task } from '../../../core/models/task.models';
import { Contact } from '../../../core/models/contact.models';

@Component({
  standalone: false,
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() saved = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  contacts: Contact[] = [];
  assignableUsers: TeamUser[] = [];
  saving = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly tasksService: TasksService,
    private readonly contactsService: ContactsService,
    private readonly teamService: TeamService,
    readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.task?.title ?? '', [Validators.required, Validators.minLength(2)]],
      description: [this.task?.description ?? ''],
      dueDate: [
        this.task?.dueDate ? this.task.dueDate.substring(0, 16) : '',
      ],
      contactId: [this.task?.contact?.id ?? ''],
      assignedTo: [this.task?.assignee?.id ?? this.authService.currentUser?.id ?? ''],
    });

    this.contactsService.list({ limit: 100 }).subscribe({
      next: (res) => (this.contacts = res.data),
    });

    if (this.canAssignTasks) {
      this.loadAssignableUsers();
    }
  }

  get canAssignTasks(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  loadAssignableUsers(): void {
    this.teamService.list().subscribe({
      next: (users) => {
        const role = this.authService.currentUser?.role;
        const userId = this.authService.currentUser?.id;

        if (role === 'ADMIN') {
          // Admin can see all users
          this.assignableUsers = users;
        } else if (role === 'MANAGER') {
          // Manager can see themselves and their sellers
          this.assignableUsers = users.filter(
            (u) => u.id === userId || u.managerId === userId
          );
        }
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.error = null;

    const value = this.form.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      title: value.title,
      ...(value.description && { description: value.description }),
      ...(value.dueDate && { dueDate: new Date(value.dueDate).toISOString() }),
      ...(value.contactId && { contactId: value.contactId }),
      ...(value.assignedTo && { assignedTo: value.assignedTo }),
    };

    const request$ = this.task
      ? this.tasksService.update(this.task.id, payload)
      : this.tasksService.create(payload);

    request$.subscribe({
      next: (task) => {
        this.saving = false;
        this.saved.emit(task);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Erro ao salvar tarefa. Tente novamente.';
      },
    });
  }

  close(): void {
    this.cancelled.emit();
  }
}
