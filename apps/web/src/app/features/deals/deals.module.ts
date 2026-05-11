import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanBoardComponent } from './kanban-board/kanban-board.component';

@NgModule({
  declarations: [KanbanBoardComponent],
  imports: [
    CommonModule,
    DragDropModule,
    RouterModule.forChild([{ path: '', component: KanbanBoardComponent }]),
  ],
  providers: [DatePipe],
})
export class DealsModule {}
