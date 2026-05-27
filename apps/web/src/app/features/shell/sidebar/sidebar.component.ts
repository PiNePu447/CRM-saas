import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
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
  @Input() collapsed = false;
  @Output() closed = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();

  private readonly allNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Contatos', route: '/contacts', icon: 'person' },
    { label: 'Empresas', route: '/companies', icon: 'domain' },
    { label: 'Negócios', route: '/deals', icon: 'account_tree' },
    { label: 'Tarefas', route: '/tasks', icon: 'task_alt' },
    { label: 'Equipe', route: '/team', icon: 'groups' , roles: ['ADMIN', 'MANAGER'] },
  ];

  constructor(
    readonly authService: AuthService,
    private router: Router
  ) {}

  get navItems(): NavItem[] {
    const role = this.authService.currentUser?.role ?? '';
    return this.allNavItems.filter((item) => !item.roles || item.roles.includes(role));
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  onNavClick(): void {
    this.closed.emit();
  }

  logout(): void {
    this.authService.logout();
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  getTenantName(user: any): string {
    return user?.tenant?.name || 'SalesForceX';
  }

  getTenantLogo(user: any): string | null {
    const branding = user?.tenant?.settings?.branding as { logoUrl?: string } | undefined;
    return branding?.logoUrl || null;
  }
}
