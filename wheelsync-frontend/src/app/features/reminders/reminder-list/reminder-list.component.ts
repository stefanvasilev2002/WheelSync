import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReminderService } from '../../../core/services/reminder.service';
import { AuthService } from '../../../core/services/auth.service';
import { MaintenanceReminderResponse } from '../../../core/models/reminder.model';
import { SERVICE_TYPE_LABELS } from '../../../core/models/service-record.model';

@Component({
  selector: 'ws-reminder-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './reminder-list.component.html'
})
export class ReminderListComponent implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  reminders = signal<MaintenanceReminderResponse[]>([]);
  loading = signal(false);

  readonly isManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly serviceTypeLabels = SERVICE_TYPE_LABELS;

  readonly displayedColumns = ['vehicle', 'serviceType', 'intervalType', 'nextDue', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.reminderService.getAll().subscribe({
      next: (data) => {
        this.reminders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading reminders', 'Close', { duration: 3000 });
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Deactivate this reminder?')) return;
    this.reminderService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Reminder deactivated', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Error deactivating reminder', 'Close', { duration: 3000 })
    });
  }

  intervalLabel(r: MaintenanceReminderResponse): string {
    if (r.intervalType === 'MILEAGE' && r.mileageInterval) {
      return `Every ${r.mileageInterval.toLocaleString()} km`;
    }
    if (r.intervalType === 'DATE' && r.dateIntervalMonths) {
      return `Every ${r.dateIntervalMonths} month(s)`;
    }
    return '—';
  }

  nextDueLabel(r: MaintenanceReminderResponse): string {
    if (r.intervalType === 'MILEAGE' && r.nextDueMileage != null) {
      return `${r.nextDueMileage.toLocaleString()} km`;
    }
    if (r.intervalType === 'DATE' && r.nextDueDate) {
      return r.nextDueDate;
    }
    return '—';
  }
}
