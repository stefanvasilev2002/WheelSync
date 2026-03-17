import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { VehicleResponse } from '../../../core/models/vehicle.model';
import { FUEL_TYPE_LABELS } from '../../../core/models/vehicle.model';

@Component({
  selector: 'ws-vehicle-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss'
})
export class VehicleListComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  vehicles = signal<VehicleResponse[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  readonly isAdminOrManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly fuelTypeLabels = FUEL_TYPE_LABELS;

  readonly displayedColumns = computed(() => {
    const cols = ['make', 'licensePlate', 'fuelType', 'currentMileage', 'driver', 'status'];
    if (this.isAdminOrManager()) cols.push('actions');
    return cols;
  });

  readonly filteredVehicles = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.vehicles();
    return this.vehicles().filter(v =>
      v.make.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      v.licensePlate.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.vehicleService.getAll().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Грешка при вчитување на возила', 'Затвори', { duration: 3000 });
      }
    });
  }

  navigateToDetail(vehicle: VehicleResponse): void {
    this.router.navigate(['/vehicles', vehicle.id]);
  }

  navigateToEdit(event: Event, vehicleId: number): void {
    event.stopPropagation();
    this.router.navigate(['/vehicles', vehicleId, 'edit']);
  }

  deleteVehicle(event: Event, vehicleId: number): void {
    event.stopPropagation();
    if (!confirm('Дали сте сигурни дека сакате да го избришете ова возило?')) return;
    this.vehicleService.delete(vehicleId).subscribe({
      next: () => {
        this.snackBar.open('Возилото е успешно избришано', 'Затвори', { duration: 3000 });
        this.loadVehicles();
      },
      error: () => {
        this.snackBar.open('Грешка при бришење на возило', 'Затвори', { duration: 3000 });
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
}
