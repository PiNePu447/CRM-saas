import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DealsService } from '../../../core/services/deals.service';
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

  constructor(private readonly dealsService: DealsService) {}

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

