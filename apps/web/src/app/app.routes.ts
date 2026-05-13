import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'platform',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/platform/platform.module').then((m) => m.PlatformModule),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/shell/shell.module').then((m) => m.ShellModule),
  },
  { path: '**', redirectTo: '' },
];
