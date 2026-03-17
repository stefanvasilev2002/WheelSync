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
        this.snackBar.open('Грешка при вчитување', 'Затвори', { duration: 3000 });
      }
    });
  }
}
