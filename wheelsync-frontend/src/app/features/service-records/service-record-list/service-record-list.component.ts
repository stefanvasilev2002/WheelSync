import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceRecordService } from '../../../core/services/service-record.service';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceRecordResponse, SERVICE_TYPE_LABELS, SERVICE_RECORD_STATUS_LABELS } from '../../../core/models/service-record.model';

@Component({
  selector: 'ws-service-record-list',
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
  templateUrl: './service-record-list.component.html'
})
export class ServiceRecordListComponent implements OnInit {
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  records = signal<ServiceRecordResponse[]>([]);
  loading = signal(false);

  readonly isManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly serviceTypeLabels = SERVICE_TYPE_LABELS;
  readonly statusLabels = SERVICE_RECORD_STATUS_LABELS;

  readonly displayedColumns = ['vehicle', 'serviceType', 'date', 'mileage', 'cost', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.serviceRecordService.getAll().subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading service records', 'Close', { duration: 3000 });
      }
    });
  }

  goToDetail(id: number): void {
    this.router.navigate(['/service-records', id]);
  }

  delete(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Delete this service record?')) return;
    this.serviceRecordService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Service record deleted', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Error deleting record', 'Close', { duration: 3000 })
    });
  }
}
