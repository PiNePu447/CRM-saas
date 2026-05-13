import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientsListComponent } from './clients-list/clients-list.component';
import { CompanyFormComponent } from './company-form/company-form.component';

@NgModule({
  declarations: [ClientsListComponent, CompanyFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: ClientsListComponent },
    ]),
  ],
})
export class ClientsModule {}
