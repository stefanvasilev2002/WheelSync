import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MileageService } from '../../../core/services/mileage.service';
import { FuelService } from '../../../core/services/fuel.service';
import { AuthService } from '../../../core/services/auth.service';
import { VehicleResponse, VehicleAssignmentResponse, FUEL_TYPE_LABELS } from '../../../core/models/vehicle.model';
import { MileageLogResponse } from '../../../core/models/mileage.model';
import { FuelLogResponse } from '../../../core/models/fuel.model';
import { AssignDialogComponent, AssignDialogData } from '../assign-dialog/assign-dialog.component';

@Component({
  selector: 'ws-vehicle-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './vehicle-detail.component.html',
  styleUrl: './vehicle-detail.component.scss'
})
export class VehicleDetailComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly mileageService = inject(MileageService);
  private readonly fuelService = inject(FuelService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  vehicle = signal<VehicleResponse | null>(null);
  assignments = signal<VehicleAssignmentResponse[]>([]);
  mileageLogs = signal<MileageLogResponse[]>([]);
  fuelLogs = signal<FuelLogResponse[]>([]);
  loading = signal(true);

  readonly isAdminOrManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly fuelTypeLabels = FUEL_TYPE_LABELS;

  readonly assignmentColumns = ['driverName', 'assignedDate', 'unassignedDate', 'status'];
  readonly mileageColumns = ['date', 'startMileage', 'endMileage', 'distance', 'note'];
  readonly fuelColumns = ['date', 'fuelType', 'quantityLiters', 'pricePerLiter', 'totalPrice', 'mileageAtRefuel'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVehicle(+id);
    }
  }

  loadVehicle(id: number): void {
    this.loading.set(true);
    this.vehicleService.getById(id).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.loading.set(false);
        this.loadAssignments(id);
        this.loadMileage(id);
        this.loadFuel(id);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Возилото не е пронајдено', 'Затвори', { duration: 3000 });
        this.router.navigate(['/vehicles']);
      }
    });
  }

  loadAssignments(vehicleId: number): void {
    this.vehicleService.getAssignmentHistory(vehicleId).subscribe({
      next: (data) => this.assignments.set(data),
      error: () => {}
    });
  }

  loadMileage(vehicleId: number): void {
    this.mileageService.getByVehicle(vehicleId).subscribe({
      next: (data) => this.mileageLogs.set(data),
      error: () => {}
    });
  }

  loadFuel(vehicleId: number): void {
    this.fuelService.getByVehicle(vehicleId).subscribe({
      next: (data) => this.fuelLogs.set(data),
      error: () => {}
    });
  }

  openAssignDialog(): void {
    const v = this.vehicle();
    if (!v) return;
    const ref = this.dialog.open(AssignDialogComponent, {
      width: '480px',
      data: {
        vehicleId: v.id,
        vehicleDisplayName: `${v.make} ${v.model} (${v.licensePlate})`,
        companyId: v.companyId
      } as AssignDialogData
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.vehicleService.assign(v.id, result).subscribe({
          next: () => {
            this.snackBar.open('Возачот е успешно доделен', 'Затвори', { duration: 3000 });
            this.loadVehicle(v.id);
          },
          error: (err) => {
            const msg = err?.error?.message || 'Грешка при доделување';
            this.snackBar.open(msg, 'Затвори', { duration: 4000 });
          }
        });
      }
    });
  }

  unassignDriver(): void {
    const v = this.vehicle();
    if (!v || !confirm('Дали сте сигурни дека сакате да го отдоделите возачот?')) return;
    this.vehicleService.unassign(v.id).subscribe({
      next: () => {
        this.snackBar.open('Возачот е успешно отдоделен', 'Затвори', { duration: 3000 });
        this.loadVehicle(v.id);
      },
      error: () => {
        this.snackBar.open('Грешка при отдоделување', 'Затвори', { duration: 3000 });
      }
    });
  }
}
