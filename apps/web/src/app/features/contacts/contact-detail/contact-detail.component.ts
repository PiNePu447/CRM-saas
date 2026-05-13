import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '../../../core/services/contacts.service';
import { Contact, Activity } from '../../../core/models/contact.models';

@Component({ standalone: false,
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.component.html',
})
export class ContactDetailComponent implements OnInit {
  contact: Contact | null = null;
  activities: Activity[] = [];
  nextCursor: string | null = null;
  loadingTimeline = false;
  loading = true;
  newNote = '';
  savingNote = false;

  activityTypeIcons: Record<string, string> = {
    NOTE: '📝',
    EMAIL: '📧',
    CALL: '📞',
    MEETING: '🤝',
    STATUS_CHANGE: '🔄',
    DEAL_MOVED: '➡️',
    TASK_CREATED: '✅',
  };

  deleting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly contactsService: ContactsService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadContact(id);
    this.loadTimeline(id);
  }

  loadContact(id: string): void {
    this.contactsService.getById(id).subscribe({
      next: (c) => {
        this.contact = c;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadTimeline(id: string, cursor?: string): void {
    this.loadingTimeline = true;
    this.contactsService.getTimeline(id, cursor).subscribe({
      next: (res) => {
        this.activities = cursor ? [...this.activities, ...res.data] : res.data;
        this.nextCursor = res.nextCursor;
        this.loadingTimeline = false;
      },
      error: () => (this.loadingTimeline = false),
    });
  }

  loadMore(): void {
    if (this.nextCursor && this.contact) {
      this.loadTimeline(this.contact.id, this.nextCursor);
    }
  }

  addNote(): void {
    if (!this.newNote.trim() || !this.contact) return;
    this.savingNote = true;

    this.contactsService
      .addActivity(this.contact.id, { type: 'NOTE', content: { body: this.newNote } })
      .subscribe({
        next: (activity) => {
          this.activities = [activity, ...this.activities];
          this.newNote = '';
          this.savingNote = false;
        },
        error: () => (this.savingNote = false),
      });
  }

  deleteContact(): void {
    if (!this.contact) return;
    if (!confirm(`Excluir o contato "${this.contact.name}"? Esta ação não pode ser desfeita.`)) return;
    this.deleting = true;
    this.contactsService.delete(this.contact.id).subscribe({
      next: () => this.router.navigate(['/contacts']),
      error: () => (this.deleting = false),
    });
  }

  getActivityLabel(type: string): string {
    const labels: Record<string, string> = {
      NOTE: 'Nota adicionada',
      EMAIL: 'E-mail enviado',
      CALL: 'Ligação realizada',
      MEETING: 'Reunião realizada',
      STATUS_CHANGE: 'Status atualizado',
      DEAL_MOVED: 'Negócio movido',
      TASK_CREATED: 'Tarefa criada',
    };
    return labels[type] ?? type;
  }
}

