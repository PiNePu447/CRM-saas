import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientsListComponent } from './clients-list/clients-list.component';

@NgModule({
  declarations: [ClientsListComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: ClientsListComponent },
    ]),
  ],
})
export class ClientsModule {}
