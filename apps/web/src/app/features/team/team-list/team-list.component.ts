import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService, TeamUser } from '../../../core/services/team.service';

@Component({
  standalone: false,
  selector: 'app-team-list',
  templateUrl: './team-list.component.html',
})
export class TeamListComponent implements OnInit {
  users: TeamUser[] = [];
  loading = false;
  search = '';

  modalVisible = false;
  editingUser: TeamUser | null = null;
  deleteConfirmId: string | null = null;
  deleting = false;

  assignModalVisible = false;
  assigningSeller: TeamUser | null = null;
  managers: TeamUser[] = [];
  selectedManagerId: string | null = null;
  assigning = false;

  constructor(
    readonly authService: AuthService,
    private readonly teamService: TeamService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get currentRole(): string {
    return this.authService.currentUser?.role ?? '';
  }

  get isAdmin(): boolean {
    return this.currentRole === 'ADMIN';
  }

  get canInvite(): boolean {
    return this.isAdmin || this.currentRole === 'MANAGER';
  }

  get filteredUsers(): TeamUser[] {
    if (!this.search.trim()) return this.users;
    const q = this.search.toLowerCase();
    return this.users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }

  loadUsers(): void {
    this.loading = true;
    this.teamService.list().subscribe({
      next: (users) => {
        this.users = users;
        this.managers = users.filter((u) => u.role === 'MANAGER');
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openCreateModal(): void {
    this.editingUser = null;
    this.modalVisible = true;
  }

  openEditModal(user: TeamUser, event: Event): void {
    event.stopPropagation();
    this.editingUser = user;
    this.modalVisible = true;
  }

  onModalClosed(): void {
    this.modalVisible = false;
    this.editingUser = null;
  }

  onUserSaved(user: TeamUser): void {
    this.modalVisible = false;
    this.editingUser = null;
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = user;
    } else {
      this.users = [...this.users, user];
    }
    this.managers = this.users.filter((u) => u.role === 'MANAGER');
  }

  confirmDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteUser(): void {
    if (!this.deleteConfirmId) return;
    this.deleting = true;
    this.teamService.remove(this.deleteConfirmId).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== this.deleteConfirmId);
        this.managers = this.users.filter((u) => u.role === 'MANAGER');
        this.deleteConfirmId = null;
        this.deleting = false;
      },
      error: () => (this.deleting = false),
    });
  }

  openAssignModal(seller: TeamUser, event: Event): void {
    event.stopPropagation();
    this.assigningSeller = seller;
    this.selectedManagerId = seller.managerId ?? null;
    this.assignModalVisible = true;
  }

  closeAssignModal(): void {
    this.assignModalVisible = false;
    this.assigningSeller = null;
    this.selectedManagerId = null;
  }

  saveAssignment(): void {
    if (!this.assigningSeller) return;
    this.assigning = true;
    this.teamService.assignManager(this.assigningSeller.id, this.selectedManagerId).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx >= 0) this.users[idx] = updated;
        this.assigning = false;
        this.closeAssignModal();
      },
      error: () => (this.assigning = false),
    });
  }

  toggleStatus(user: TeamUser, event: Event): void {
    event.stopPropagation();
    this.teamService.update(user.id, { isActive: !user.isActive }).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx >= 0) this.users[idx] = updated;
      },
    });
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      MANAGER: 'Gerente',
      SELLER: 'Vendedor',
    };
    return labels[role] ?? role;
  }

  roleClass(role: string): string {
    const classes: Record<string, string> = {
      ADMIN: 'badge-purple',
      MANAGER: 'badge-blue',
      SELLER: 'badge-gray',
    };
    return classes[role] ?? 'badge-gray';
  }
}
