import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamListComponent } from './team-list/team-list.component';
import { UserFormComponent } from './user-form/user-form.component';

@NgModule({
  declarations: [TeamListComponent, UserFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: TeamListComponent },
    ]),
  ],
})
export class TeamModule {}
