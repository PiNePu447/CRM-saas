import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ContactListComponent } from './contact-list/contact-list.component';
import { ContactDetailComponent } from './contact-detail/contact-detail.component';
import { ContactFormComponent } from './contact-form/contact-form.component';

@NgModule({
  declarations: [ContactListComponent, ContactDetailComponent, ContactFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: ContactListComponent },
      { path: 'new', component: ContactFormComponent },
      { path: ':id/edit', component: ContactFormComponent },
      { path: ':id', component: ContactDetailComponent },
    ]),
  ],
})
export class ContactsModule {}
