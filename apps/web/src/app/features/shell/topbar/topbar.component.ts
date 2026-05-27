import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({ standalone: false,
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  constructor(readonly authService: AuthService) {}
}
