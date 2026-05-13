import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DealsService } from '../../../core/services/deals.service';
import { ContactsService } from '../../../core/services/contacts.service';
import { Deal, Pipeline, PipelineStage } from '../../../core/models/deal.models';
import { Contact } from '../../../core/models/contact.models';

@Component({
  standalone: false,
  selector: 'app-deal-form',
  templateUrl: './deal-form.component.html',
})
export class DealFormComponent implements OnInit {
  @Input() deal: Deal | null = null;
  @Input() preselectedStageId: string | null = null;
  @Input() pipelines: Pipeline[] = [];
  @Output() saved = new EventEmitter<Deal>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  contacts: Contact[] = [];
  stages: PipelineStage[] = [];
  saving = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dealsService: DealsService,
    private readonly contactsService: ContactsService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.deal?.title ?? '', [Validators.required, Validators.minLength(2)]],
      contactId: [this.deal?.contact?.id ?? '', [Validators.required]],
      pipelineId: [this.deal?.pipeline?.id ?? (this.pipelines[0]?.id ?? ''), [Validators.required]],
      stageId: [this.deal?.stage?.id ?? this.preselectedStageId ?? '', [Validators.required]],
      value: [this.deal?.value ?? ''],
      probability: [this.deal?.probability ?? 50, [Validators.min(0), Validators.max(100)]],
      expectedCloseDate: [
        this.deal?.expectedCloseDate ? this.deal.expectedCloseDate.substring(0, 10) : '',
      ],
    });

    this.loadContacts();
    this.onPipelineChange(this.form.value.pipelineId);

    this.form.get('pipelineId')?.valueChanges.subscribe((id) => this.onPipelineChange(id));
  }

  loadContacts(): void {
    this.contactsService.list({ limit: 100 }).subscribe({
      next: (res) => (this.contacts = res.data),
    });
  }

  onPipelineChange(pipelineId: string): void {
    const pipeline = this.pipelines.find((p) => p.id === pipelineId);
    this.stages = pipeline?.stages ?? [];

    if (!this.form.value.stageId && this.stages.length > 0) {
      this.form.patchValue({ stageId: this.stages[0].id });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.error = null;

    const value = this.form.value;
    const payload = {
      title: value.title,
      contactId: value.contactId,
      pipelineId: value.pipelineId,
      stageId: value.stageId,
      ...(value.value !== '' && value.value != null && { value: Number(value.value) }),
      ...(value.probability != null && { probability: Number(value.probability) }),
      ...(value.expectedCloseDate && { expectedCloseDate: value.expectedCloseDate }),
    };

    const request$ = this.deal
      ? this.dealsService.update(this.deal.id, payload)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : this.dealsService.create(payload as any);

    request$.subscribe({
      next: (deal) => {
        this.saving = false;
        this.saved.emit(deal);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Erro ao salvar negócio. Tente novamente.';
      },
    });
  }

  close(): void {
    this.cancelled.emit();
  }
}
