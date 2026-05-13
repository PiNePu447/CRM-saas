import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TasksService } from '../../../core/services/tasks.service';
import { ContactsService } from '../../../core/services/contacts.service';
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
  saving = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly tasksService: TasksService,
    private readonly contactsService: ContactsService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.task?.title ?? '', [Validators.required, Validators.minLength(2)]],
      description: [this.task?.description ?? ''],
      dueDate: [
        this.task?.dueDate ? this.task.dueDate.substring(0, 16) : '',
      ],
      contactId: [this.task?.contact?.id ?? ''],
    });

    this.contactsService.list({ limit: 100 }).subscribe({
      next: (res) => (this.contacts = res.data),
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
