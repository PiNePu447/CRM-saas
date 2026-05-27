import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService, TeamUser, InviteUserPayload, UpdateUserPayload } from '../../../core/services/team.service';

@Component({
  standalone: false,
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() user: TeamUser | null = null;
  @Input() managers: TeamUser[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<TeamUser>();

  form = {
    name: '',
    email: '',
    role: 'SELLER' as 'ADMIN' | 'MANAGER' | 'SELLER',
    temporaryPassword: '',
    managerId: null as string | null,
    isActive: true,
  };

  saving = false;
  error = '';
  showPassword = false;

  constructor(
    private readonly teamService: TeamService,
    readonly authService: AuthService,
  ) {}

  get isEdit(): boolean {
    return !!this.user;
  }

  get isAdmin(): boolean {
    return this.authService.currentUser?.role === 'ADMIN';
  }

  get isManager(): boolean {
    return this.authService.currentUser?.role === 'MANAGER';
  }

  get availableRoles(): { value: string; label: string }[] {
    if (this.isAdmin) {
      return [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'MANAGER', label: 'Gerente' },
        { value: 'SELLER', label: 'Vendedor' },
      ];
    }
    // MANAGER can only create sellers
    return [{ value: 'SELLER', label: 'Vendedor' }];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      if (this.user) {
        this.form = {
          name: this.user.name,
          email: this.user.email,
          role: this.user.role,
          temporaryPassword: '',
          managerId: this.user.managerId ?? null,
          isActive: this.user.isActive,
        };
      } else {
        this.form = {
          name: '',
          email: '',
          role: this.isManager ? 'SELLER' : 'SELLER',
          temporaryPassword: '',
          managerId: this.isManager ? (this.authService.currentUser?.id ?? null) : null,
          isActive: true,
        };
      }
      this.error = '';
      this.showPassword = false;
    }
  }

  submit(): void {
    if (!this.form.name.trim()) {
      this.error = 'Nome é obrigatório.';
      return;
    }

    if (!this.isEdit) {
      if (!this.form.email.trim()) {
        this.error = 'E-mail é obrigatório.';
        return;
      }
      if (!this.form.temporaryPassword.trim()) {
        this.error = 'Senha temporária é obrigatória.';
        return;
      }
    }

    this.saving = true;
    this.error = '';

    if (this.isEdit) {
      const payload: UpdateUserPayload = {
        name: this.form.name.trim(),
        isActive: this.form.isActive,
        ...(this.isAdmin && this.form.role !== this.user?.role && { role: this.form.role }),
        ...('managerId' in this.form && this.form.role === 'SELLER' && { managerId: this.form.managerId }),
      };

      this.teamService.update(this.user!.id, payload).subscribe({
        next: (result) => {
          this.saving = false;
          this.saved.emit(result);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message ?? 'Erro ao atualizar usuário. Tente novamente.';
        },
      });
    } else {
      const payload: InviteUserPayload = {
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        role: this.form.role,
        temporaryPassword: this.form.temporaryPassword,
        ...(this.form.role === 'SELLER' && this.form.managerId && { managerId: this.form.managerId }),
      };

      this.teamService.invite(payload).subscribe({
        next: (result) => {
          this.saving = false;
          this.saved.emit(result);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message ?? 'Erro ao convidar usuário. Tente novamente.';
        },
      });
    }
  }

  close(): void {
    if (!this.saving) this.closed.emit();
  }
}
