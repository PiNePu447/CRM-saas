import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({ standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'grid' },
    { label: 'Contatos', route: '/contacts', icon: 'users' },
    { label: 'Negócios', route: '/deals', icon: 'trending-up' },
    { label: 'Tarefas', route: '/tasks', icon: 'check-square' },
  ];

  constructor(readonly authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}

