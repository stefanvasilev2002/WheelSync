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
import { FuelService } from '../../../core/services/fuel.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExportService } from '../../../core/services/export.service';
import { FuelLogResponse } from '../../../core/models/fuel.model';
import { FUEL_TYPE_LABELS } from '../../../core/models/vehicle.model';

@Component({
  selector: 'ws-fuel-list',
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
  templateUrl: './fuel-list.component.html',
  styleUrl: './fuel-list.component.scss'
})
export class FuelListComponent implements OnInit {
  private readonly fuelService = inject(FuelService);
  private readonly authService = inject(AuthService);
  private readonly exportService = inject(ExportService);
  private readonly snackBar = inject(MatSnackBar);

  logs = signal<FuelLogResponse[]>([]);
  loading = signal(false);

  readonly isManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly fuelTypeLabels = FUEL_TYPE_LABELS;

  readonly displayedColumns = computed(() => {
    const cols = ['vehicle', 'date', 'fuelType', 'quantityLiters', 'pricePerLiter', 'totalPrice', 'mileageAtRefuel', 'consumption'];
    if (this.isManager()) cols.unshift('driver');
    return cols;
  });

  readonly totalLiters = computed(() =>
    this.logs().reduce((sum, l) => sum + l.quantityLiters, 0)
  );

  readonly totalSpent = computed(() =>
    this.logs().reduce((sum, l) => sum + l.totalPrice, 0)
  );

  ngOnInit(): void {
    this.loadLogs();
  }

  exportCsv(): void {
    const rows = this.logs().map(l => ({
      Date: l.date,
      Vehicle: l.vehicleDisplayName,
      Driver: l.driverName,
      'Fuel Type': l.fuelType,
      'Quantity (L)': l.quantityLiters,
      'Price/L (MKD)': l.pricePerLiter,
      'Total (MKD)': l.totalPrice,
      'Mileage at Refuel (km)': l.mileageAtRefuel,
      'Consumption (L/100km)': l.consumption ?? ''
    }));
    this.exportService.exportToCsv('fuel_log', rows);
  }

  loadLogs(): void {
    this.loading.set(true);
    const obs = this.isManager()
      ? this.fuelService.getAll()
      : this.fuelService.getMyLogs();

    obs.subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading records', 'Close', { duration: 3000 });
      }
    });
  }
}
