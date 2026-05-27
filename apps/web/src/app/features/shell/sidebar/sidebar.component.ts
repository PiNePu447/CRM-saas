import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
}

@Component({ standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  private readonly allNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'grid' },
    { label: 'Contatos', route: '/contacts', icon: 'users' },
    { label: 'Empresas', route: '/companies', icon: 'building' },
    { label: 'Negócios', route: '/deals', icon: 'trending-up' },
    { label: 'Tarefas', route: '/tasks', icon: 'check-square' },
    { label: 'Equipe', route: '/team', icon: 'team', roles: ['ADMIN', 'MANAGER'] },
  ];

  constructor(readonly authService: AuthService) {}

  get navItems(): NavItem[] {
    const role = this.authService.currentUser?.role ?? '';
    return this.allNavItems.filter((item) => !item.roles || item.roles.includes(role));
  }

  onNavClick(): void {
    this.closed.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
