import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MileageService } from '../../../core/services/mileage.service';
import { AuthService } from '../../../core/services/auth.service';
import { MileageLogResponse } from '../../../core/models/mileage.model';

@Component({
  selector: 'ws-mileage-list',
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
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './mileage-list.component.html',
  styleUrl: './mileage-list.component.scss'
})
export class MileageListComponent implements OnInit {
  private readonly mileageService = inject(MileageService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  logs = signal<MileageLogResponse[]>([]);
  loading = signal(false);

  readonly isManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly displayedColumns = computed(() => {
    const cols = ['vehicle', 'date', 'startMileage', 'endMileage', 'distance', 'note'];
    if (this.isManager()) cols.splice(0, 0, 'driver');
    return cols;
  });

  readonly totalDistance = computed(() =>
    this.logs().reduce((sum, log) => sum + log.distance, 0)
  );

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    const obs = this.isManager()
      ? this.mileageService.getAll()
      : this.mileageService.getMyLogs();

    obs.subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Грешка при вчитување', 'Затвори', { duration: 3000 });
      }
    });
  }
}
