import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DealsService } from '../../../core/services/deals.service';
import { AuthService } from '../../../core/services/auth.service';
import { Deal, KanbanBoard, KanbanStage, Pipeline } from '../../../core/models/deal.models';

@Component({ standalone: false,
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
})
export class KanbanBoardComponent implements OnInit {
  board: KanbanBoard | null = null;
  pipelines: Pipeline[] = [];
  selectedPipelineId: string | null = null;
  loading = true;

  showDealForm = false;
  editingDeal: Deal | null = null;
  preselectedStageId: string | null = null;

  showPipelineSettings = false;

  constructor(
    private readonly dealsService: DealsService,
    private readonly authService: AuthService,
  ) {}

  get isAdmin(): boolean {
    return this.authService.currentUser?.role === 'ADMIN';
  }

  ngOnInit(): void {
    this.dealsService.listPipelines().subscribe({
      next: (pipelines) => {
        this.pipelines = pipelines;
        const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
        if (defaultPipeline) {
          this.selectedPipelineId = defaultPipeline.id;
          this.loadBoard(defaultPipeline.id);
        } else {
          this.loading = false;
        }
      },
      error: () => (this.loading = false),
    });
  }

  loadBoard(pipelineId: string): void {
    this.loading = true;
    this.dealsService.getKanban(pipelineId).subscribe({
      next: (board) => {
        this.board = board;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPipelineChange(pipelineId: string): void {
    this.selectedPipelineId = pipelineId;
    this.loadBoard(pipelineId);
  }

  /** Called when a deal card is dropped into a stage column */
  onDrop(event: CdkDragDrop<Deal[]>, targetStage: KanbanStage): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updatePosition(
        event.container.data,
        event.currentIndex,
        targetStage.id,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.updatePosition(
        event.container.data,
        event.currentIndex,
        targetStage.id,
      );
    }
  }

  private updatePosition(deals: Deal[], index: number, stageId: string): void {
    const deal = deals[index];
    if (!deal) return;

    const prev = deals[index - 1]?.position ?? 0;
    const next = deals[index + 1]?.position ?? prev + 2;
    const newPosition = (prev + next) / 2;

    deal.position = newPosition;
    deal.stage = this.board!.stages.find((s) => s.id === stageId)!;

    this.dealsService.move(deal.id, stageId, newPosition).subscribe({
      error: () => this.loadBoard(this.selectedPipelineId!),
    });
  }

  openNewDeal(stageId?: string): void {
    this.editingDeal = null;
    this.preselectedStageId = stageId ?? null;
    this.showDealForm = true;
  }

  openEditDeal(deal: Deal): void {
    this.editingDeal = deal;
    this.preselectedStageId = null;
    this.showDealForm = true;
  }

  onDealSaved(deal: Deal): void {
    this.showDealForm = false;
    this.editingDeal = null;
    if (this.selectedPipelineId) {
      this.loadBoard(this.selectedPipelineId);
    }
  }

  closeDealForm(): void {
    this.showDealForm = false;
    this.editingDeal = null;
  }

  openPipelineSettings(): void {
    this.showPipelineSettings = true;
  }

  onPipelineSettingsClosed(updatedPipelines: Pipeline[]): void {
    this.showPipelineSettings = false;
    const prevCount = this.pipelines.length;
    this.pipelines = updatedPipelines;

    // Reload pipelines from API to ensure consistency, then reload board
    this.dealsService.listPipelines().subscribe({
      next: (pipelines) => {
        this.pipelines = pipelines;
        const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
        if (defaultPipeline) {
          this.selectedPipelineId = defaultPipeline.id;
          this.loadBoard(defaultPipeline.id);
        } else if (prevCount > 0 && pipelines.length === 0) {
          this.board = null;
        }
      },
    });
  }

  getStageConnectedList(currentStageId: string): string[] {
    return this.board?.stages.filter((s) => s.id !== currentStageId).map((s) => s.id) ?? [];
  }

  formatCurrency(value?: number): string {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatTotalValue(value: number): string {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  }
}

