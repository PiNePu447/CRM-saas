import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
})
export class ProfileMenuComponent {
  isOpen = false;
  showEditModal = false;
  editForm = {
    name: '',
    avatarUrl: '',
  };
  saving = false;

  constructor(
    readonly authService: AuthService,
    private readonly http: HttpClient
  ) {}

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  openEditModal(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.editForm.name = user.name;
      this.editForm.avatarUrl = user.avatarUrl || '';
    }
    this.showEditModal = true;
    this.closeDropdown();
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveProfile(): void {
    this.saving = true;
    const payload: any = {};
    
    if (this.editForm.name) payload.name = this.editForm.name;
    if (this.editForm.avatarUrl) payload.avatarUrl = this.editForm.avatarUrl;

    this.http.patch(`${environment.apiUrl}/users/profile/me`, payload).subscribe({
      next: (updatedUser: any) => {
        this.authService.loadProfile().subscribe();
        this.saving = false;
        this.closeEditModal();
      },
      error: () => {
        this.saving = false;
        alert('Erro ao atualizar perfil');
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getUserInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
