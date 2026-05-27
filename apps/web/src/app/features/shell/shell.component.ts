import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({ standalone: false,
  selector: 'app-shell',
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  sidebarOpen = false;
  sidebarCollapsed = false;

  constructor(readonly authService: AuthService) {}

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onSidebarToggle(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}

