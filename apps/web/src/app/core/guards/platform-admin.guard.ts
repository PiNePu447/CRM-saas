import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate() {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (user?.role === 'PLATFORM_ADMIN') return true;
        this.router.navigate(['/dashboard']);
        return false;
      }),
    );
  }
}
