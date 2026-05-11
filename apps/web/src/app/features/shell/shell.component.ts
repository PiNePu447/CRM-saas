import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({ standalone: false,
  selector: 'app-shell',
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  constructor(readonly authService: AuthService) {}
}

