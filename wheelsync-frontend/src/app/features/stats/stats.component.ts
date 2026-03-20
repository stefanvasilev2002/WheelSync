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

const SERVICE_TYPE_LABELS: Record<string, string> = {
  OIL_CHANGE: 'Oil Change',
  FILTER_CHANGE: 'Filter Change',
  TIRE_CHANGE: 'Tire Change',
  ENGINE_REPAIR: 'Engine Repair',
  TECHNICAL_INSPECTION: 'Technical Inspection',
  OTHER: 'Other'
};

const SERVICE_TYPE_COLORS = [
  '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047'
];

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

  readonly topVehicleColumns = ['rank', 'vehicle', 'distance', 'fuelCost', 'avgConsumption'];

  // ── Doughnut: Fleet assignment status ──────────────────────────────────
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

  // ── Doughnut: Defect status ─────────────────────────────────────────────
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

  // ── Bar: Top vehicles by distance ───────────────────────────────────────
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

  // ── Line: Monthly costs (fuel + service) — FR-10.1 ─────────────────────
  readonly monthlyCostData = computed<ChartData<'line'>>(() => {
    const rows = this.stats()?.monthlyCosts ?? [];
    return {
      labels: rows.map(r => r.month),
      datasets: [
        {
          label: 'Fuel Cost (MKD)',
          data: rows.map(r => r.fuelCost),
          borderColor: '#1e88e5',
          backgroundColor: 'rgba(30,136,229,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4
        },
        {
          label: 'Service Cost (MKD)',
          data: rows.map(r => r.serviceCost),
          borderColor: '#43a047',
          backgroundColor: 'rgba(67,160,71,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4
        }
      ]
    };
  });

  // ── Doughnut: Cost by service type — FR-10.2 ───────────────────────────
  readonly serviceTypeCostData = computed<ChartData<'doughnut'>>(() => {
    const map = this.stats()?.costByServiceType ?? {};
    const entries = Object.entries(map).filter(([, v]) => v > 0);
    return {
      labels: entries.map(([k]) => SERVICE_TYPE_LABELS[k] ?? k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: SERVICE_TYPE_COLORS.slice(0, entries.length),
        borderWidth: 0
      }]
    };
  });

  // ── Bar: Average fuel consumption per vehicle — FR-10.3 ────────────────
  readonly consumptionData = computed<ChartData<'bar'>>(() => {
    const rows = (this.stats()?.topVehiclesByDistance ?? []).filter(r => r.avgConsumption != null);
    return {
      labels: rows.map(r => r.vehicleName),
      datasets: [{
        label: 'Avg Consumption (L/100km)',
        data: rows.map(r => r.avgConsumption ?? 0),
        backgroundColor: '#00897b',
        borderRadius: 4
      }]
    };
  });

  // ── Chart options ───────────────────────────────────────────────────────
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

  readonly lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
    }
  };

  readonly consumptionBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${(ctx.parsed.x ?? 0).toFixed(2)} L/100km`
        }
      }
    },
    scales: {
      x: { beginAtZero: true, grid: { display: false } },
      y: { grid: { display: false } }
    }
  };

  readonly hasConsumptionData = computed(() =>
    (this.stats()?.topVehiclesByDistance ?? []).some(r => r.avgConsumption != null)
  );

  readonly hasServiceTypeCostData = computed(() =>
    Object.values(this.stats()?.costByServiceType ?? {}).some(v => v > 0)
  );

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
