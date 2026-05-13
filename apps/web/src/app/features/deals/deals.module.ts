import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanBoardComponent } from './kanban-board/kanban-board.component';
import { DealFormComponent } from './deal-form/deal-form.component';
import { PipelineSettingsComponent } from './pipeline-settings/pipeline-settings.component';

@NgModule({
  declarations: [KanbanBoardComponent, DealFormComponent, PipelineSettingsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule.forChild([{ path: '', component: KanbanBoardComponent }]),
  ],
  providers: [DatePipe],
})
export class DealsModule {}
