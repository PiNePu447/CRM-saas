import { Component } from '@angular/core';
import { Toast, ToastService } from '../../../core/services/toast.service';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
})
export class ToastContainerComponent {
  toasts$: Observable<Toast[]>;

  constructor(private readonly toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  remove(id: string): void {
    this.toastService.remove(id);
  }
}
