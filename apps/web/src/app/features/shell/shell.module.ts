import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShellComponent } from './shell.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthGuard } from '../../core/guards/auth.guard';

@NgModule({
  declarations: [ShellComponent, SidebarComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ShellComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadChildren: () =>
              import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
          },
          {
            path: 'contacts',
            loadChildren: () =>
              import('../contacts/contacts.module').then((m) => m.ContactsModule),
          },
          {
            path: 'deals',
            loadChildren: () =>
              import('../deals/deals.module').then((m) => m.DealsModule),
          },
          {
            path: 'tasks',
            loadChildren: () =>
              import('../tasks/tasks.module').then((m) => m.TasksModule),
          },
          {
            path: 'companies',
            loadChildren: () =>
              import('../clients/clients.module').then((m) => m.ClientsModule),
          },
          {
            path: 'clients',
            redirectTo: 'companies',
            pathMatch: 'full',
          },
          {
            path: 'team',
            loadChildren: () =>
              import('../team/team.module').then((m) => m.TeamModule),
          },
        ],
      },
    ]),
  ],
})
export class ShellModule {}
