import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantListComponent } from './tenant-list/tenant-list.component';
import { PlatformAdminGuard } from '../../core/guards/platform-admin.guard';

@NgModule({
  declarations: [TenantListComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        canActivate: [PlatformAdminGuard],
        component: TenantListComponent,
      },
    ]),
  ],
})
export class PlatformModule {}
