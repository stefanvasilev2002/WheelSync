import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
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
    MatDividerModule,
    BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly snackBar = inject(MatSnackBar);

  stats = signal<StatsResponse | null>(null);
  loading = signal(false);

  readonly topVehicleColumns = ['rank', 'vehicle', 'distance', 'fuelCost'];

  // Doughnut: Fleet assignment status
  readonly fleetChartData = computed<ChartData<'doughnut'>>(() => {
    const s = this.stats();
    return {
      labels: ['Assigned', 'Unassigned'],
      datasets: [{
        data: [s?.assignedVehicles ?? 0, s?.unassignedVehicles ?? 0],
        backgroundColor: ['#3949ab', '#e8eaf6'],
        borderWidth: 0
      }]
    };
  });

  // Doughnut: Defect status
  readonly defectChartData = computed<ChartData<'doughnut'>>(() => {
    const s = this.stats();
    return {
      labels: ['Open', 'Resolved'],
      datasets: [{
        data: [s?.openDefects ?? 0, s?.resolvedDefects ?? 0],
        backgroundColor: ['#e53935', '#43a047'],
        borderWidth: 0
      }]
    };
  });

  // Horizontal bar: Top vehicles by distance
  readonly vehicleBarData = computed<ChartData<'bar'>>(() => {
    const rows = this.stats()?.topVehiclesByDistance ?? [];
    return {
      labels: rows.map(r => r.vehicleName),
      datasets: [{
        label: 'Distance (km)',
        data: rows.map(r => r.distanceKm),
        backgroundColor: '#3949ab',
        borderRadius: 4
      }]
    };
  });

  readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { display: false } },
      y: { grid: { display: false } }
    }
  };

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
