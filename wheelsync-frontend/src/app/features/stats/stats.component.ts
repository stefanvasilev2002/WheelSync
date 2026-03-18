import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { StatsService } from '../../core/services/stats.service';
import { StatsResponse } from '../../core/models/stats.model';

@Component({
  selector: 'ws-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule
  ],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly snackBar = inject(MatSnackBar);

  stats = signal<StatsResponse | null>(null);
  loading = signal(false);

  readonly topVehicleColumns = ['rank', 'vehicle', 'distance', 'fuelCost'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.statsService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading statistics', 'Close', { duration: 3000 });
      }
    });
  }
}
