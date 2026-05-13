import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Pipeline, PipelineStage } from '../../../core/models/deal.models';
import {
  CreateStageData,
  DealsService,
  UpdatePipelineData,
  UpdateStageData,
} from '../../../core/services/deals.service';

type ViewMode = 'list' | 'edit-pipeline' | 'edit-stages';

@Component({
  standalone: false,
  selector: 'app-pipeline-settings',
  templateUrl: './pipeline-settings.component.html',
})
export class PipelineSettingsComponent implements OnInit {
  @Input() pipelines: Pipeline[] = [];
  @Output() closed = new EventEmitter<Pipeline[]>();

  view: ViewMode = 'list';
  selectedPipeline: Pipeline | null = null;

  pipelineName = '';
  newPipelineName = '';
  saving = false;
  error = '';

  newStageName = '';
  newStageColor = '#6B7280';
  newStageProbability = 50;

  editingStage: PipelineStage | null = null;
  editStageName = '';
  editStageColor = '';
  editStageProbability = 0;

  constructor(private readonly dealsService: DealsService) {}

  ngOnInit(): void {}

  close(): void {
    this.closed.emit(this.pipelines);
  }

  // ── Pipeline list ──────────────────────────────────────────────

  openCreatePipeline(): void {
    this.newPipelineName = '';
    this.error = '';
    this.view = 'edit-pipeline';
    this.selectedPipeline = null;
  }

  openEditPipeline(pipeline: Pipeline): void {
    this.selectedPipeline = pipeline;
    this.pipelineName = pipeline.name;
    this.error = '';
    this.view = 'edit-stages';
  }

  openRenamePipeline(pipeline: Pipeline): void {
    this.selectedPipeline = pipeline;
    this.pipelineName = pipeline.name;
    this.error = '';
    this.view = 'edit-pipeline';
  }

  // ── Create pipeline ────────────────────────────────────────────

  createPipeline(): void {
    if (!this.newPipelineName.trim()) return;
    this.saving = true;
    this.error = '';
    this.dealsService.createPipeline({ name: this.newPipelineName.trim() }).subscribe({
      next: (pipeline) => {
        this.pipelines = [...this.pipelines, pipeline];
        this.saving = false;
        this.view = 'edit-stages';
        this.selectedPipeline = pipeline;
        this.pipelineName = pipeline.name;
      },
      error: (err) => {
        this.error = err?.error?.message?.error ?? 'Erro ao criar pipeline';
        this.saving = false;
      },
    });
  }

  // ── Rename pipeline ────────────────────────────────────────────

  savePipelineName(): void {
    if (!this.selectedPipeline || !this.pipelineName.trim()) return;
    this.saving = true;
    this.error = '';
    const data: UpdatePipelineData = { name: this.pipelineName.trim() };
    this.dealsService.updatePipeline(this.selectedPipeline.id, data).subscribe({
      next: (updated) => {
        this.pipelines = this.pipelines.map((p) => (p.id === updated.id ? { ...p, name: updated.name } : p));
        if (this.selectedPipeline) this.selectedPipeline = { ...this.selectedPipeline, name: updated.name };
        this.saving = false;
        this.view = 'edit-stages';
      },
      error: (err) => {
        this.error = err?.error?.message?.error ?? 'Erro ao salvar nome do pipeline';
        this.saving = false;
      },
    });
  }

  setDefault(pipeline: Pipeline): void {
    this.dealsService.updatePipeline(pipeline.id, { isDefault: true }).subscribe({
      next: () => {
        this.pipelines = this.pipelines.map((p) => ({ ...p, isDefault: p.id === pipeline.id }));
      },
    });
  }

  deletePipeline(pipeline: Pipeline): void {
    if (!confirm(`Remover pipeline "${pipeline.name}"? Esta ação não pode ser desfeita.`)) return;
    this.dealsService.deletePipeline(pipeline.id).subscribe({
      next: () => {
        this.pipelines = this.pipelines.filter((p) => p.id !== pipeline.id);
      },
      error: (err) => {
        alert(err?.error?.message?.error ?? 'Não foi possível remover o pipeline.');
      },
    });
  }

  // ── Stages ─────────────────────────────────────────────────────

  addStage(): void {
    if (!this.selectedPipeline || !this.newStageName.trim()) return;
    this.saving = true;
    this.error = '';
    const data: CreateStageData = {
      name: this.newStageName.trim(),
      color: this.newStageColor,
      probabilityDefault: this.newStageProbability,
    };
    this.dealsService.createStage(this.selectedPipeline.id, data).subscribe({
      next: (stage) => {
        if (this.selectedPipeline) {
          this.selectedPipeline = {
            ...this.selectedPipeline,
            stages: [...this.selectedPipeline.stages, stage],
          };
        }
        this.newStageName = '';
        this.newStageColor = '#6B7280';
        this.newStageProbability = 50;
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.error?.message?.error ?? 'Erro ao adicionar estágio';
        this.saving = false;
      },
    });
  }

  startEditStage(stage: PipelineStage): void {
    this.editingStage = stage;
    this.editStageName = stage.name;
    this.editStageColor = stage.color;
    this.editStageProbability = stage.probabilityDefault;
  }

  cancelEditStage(): void {
    this.editingStage = null;
  }

  saveStage(): void {
    if (!this.selectedPipeline || !this.editingStage) return;
    this.saving = true;
    this.error = '';
    const data: UpdateStageData = {
      name: this.editStageName.trim(),
      color: this.editStageColor,
      probabilityDefault: this.editStageProbability,
    };
    this.dealsService.updateStage(this.selectedPipeline.id, this.editingStage.id, data).subscribe({
      next: (updated) => {
        if (this.selectedPipeline) {
          this.selectedPipeline = {
            ...this.selectedPipeline,
            stages: this.selectedPipeline.stages.map((s) => (s.id === updated.id ? updated : s)),
          };
        }
        this.editingStage = null;
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.error?.message?.error ?? 'Erro ao salvar estágio';
        this.saving = false;
      },
    });
  }

  deleteStage(stage: PipelineStage): void {
    if (!this.selectedPipeline) return;
    if (!confirm(`Remover estágio "${stage.name}"?`)) return;
    this.dealsService.deleteStage(this.selectedPipeline.id, stage.id).subscribe({
      next: () => {
        if (this.selectedPipeline) {
          this.selectedPipeline = {
            ...this.selectedPipeline,
            stages: this.selectedPipeline.stages.filter((s) => s.id !== stage.id),
          };
        }
      },
      error: (err) => {
        alert(err?.error?.message?.error ?? 'Não foi possível remover o estágio.');
      },
    });
  }

  moveStageUp(stage: PipelineStage): void {
    if (!this.selectedPipeline) return;
    const stages = [...this.selectedPipeline.stages];
    const idx = stages.findIndex((s) => s.id === stage.id);
    if (idx <= 0) return;
    [stages[idx - 1], stages[idx]] = [stages[idx], stages[idx - 1]];
    this.reorder(stages);
  }

  moveStageDown(stage: PipelineStage): void {
    if (!this.selectedPipeline) return;
    const stages = [...this.selectedPipeline.stages];
    const idx = stages.findIndex((s) => s.id === stage.id);
    if (idx < 0 || idx >= stages.length - 1) return;
    [stages[idx], stages[idx + 1]] = [stages[idx + 1], stages[idx]];
    this.reorder(stages);
  }

  private reorder(stages: PipelineStage[]): void {
    if (!this.selectedPipeline) return;
    const stageIds = stages.map((s) => s.id);
    this.dealsService.reorderStages(this.selectedPipeline.id, stageIds).subscribe({
      next: (updated) => {
        if (this.selectedPipeline && updated) {
          this.selectedPipeline = { ...this.selectedPipeline, stages: updated.stages ?? stages };
        }
      },
    });
    this.selectedPipeline = { ...this.selectedPipeline, stages };
  }

  backToList(): void {
    this.view = 'list';
    this.selectedPipeline = null;
    this.error = '';
  }
}
