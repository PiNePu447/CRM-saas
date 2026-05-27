import { Component, OnInit } from '@angular/core';
import { NotificationsService, Notification } from '../../../core/services/notifications.service';

@Component({
  standalone: false,
  selector: 'app-notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
})
export class NotificationsDropdownComponent implements OnInit {
  notifications: Notification[] = [];
  loading = false;
  isOpen = false;

  constructor(readonly notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationsService.list().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.read) return;

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
      },
    });
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.read = true));
      },
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d atrás`;
    return date.toLocaleDateString('pt-BR');
  }
}
