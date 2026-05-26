import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FuelService } from '../../../core/services/fuel.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { SyncService } from '../../../core/services/sync.service';
import { OfflineDbService } from '../../../core/services/offline-db.service';
import { VehicleResponse, FUEL_TYPE_LABELS } from '../../../core/models/vehicle.model';
import { FuelType } from '../../../core/models/vehicle.model';

@Component({
  selector: 'ws-fuel-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './fuel-form.component.html',
  styleUrl: './fuel-form.component.scss'
})
export class FuelFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly fuelService = inject(FuelService);
  private readonly vehicleService = inject(VehicleService);
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(SyncService);
  private readonly offlineDb = inject(OfflineDbService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isOnline = this.syncService.isOnline;

  vehicles = signal<VehicleResponse[]>([]);
  loadingVehicles = signal(false);
  saving = signal(false);
  calculatedTotal = signal(0);

  readonly fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'PETROL',   label: FUEL_TYPE_LABELS['PETROL'] },
    { value: 'DIESEL',   label: FUEL_TYPE_LABELS['DIESEL'] },
    { value: 'LPG',      label: FUEL_TYPE_LABELS['LPG'] },
    { value: 'ELECTRIC', label: FUEL_TYPE_LABELS['ELECTRIC'] },
    { value: 'HYBRID',   label: FUEL_TYPE_LABELS['HYBRID'] }
  ];

  form = this.fb.group({
    vehicleId:       [null as number | null, [Validators.required]],
    date:            [new Date(),            [Validators.required]],
    fuelType:        [null as FuelType | null, [Validators.required]],
    quantityLiters:  [null as number | null, [Validators.required, Validators.min(0.01)]],
    pricePerLiter:   [null as number | null, [Validators.required, Validators.min(0.01)]],
    mileageAtRefuel: [null as number | null, [Validators.required, Validators.min(0)]],
    location:        ['']
  });

  ngOnInit(): void {
    this.loadVehicles();
    this.form.get('quantityLiters')?.valueChanges.subscribe(() => this.updateTotal());
    this.form.get('pricePerLiter')?.valueChanges.subscribe(() => this.updateTotal());
  }

  loadVehicles(): void {
    this.loadingVehicles.set(true);

    // Offline-first: if no connection, serve from IndexedDB immediately
    if (!navigator.onLine) {
      this.offlineDb.getCachedVehicles().then(cached => {
        this.vehicles.set(cached.filter(v => v.isActive));
        this.loadingVehicles.set(false);
        if (cached.length === 0) {
          this.snackBar.open('Offline — no cached vehicles available. Go online first.', 'OK', { duration: 5000 });
        }
      });
      return;
    }

    const obs = this.authService.isDriver()
      ? this.vehicleService.getMyVehicles()
      : this.vehicleService.getAll();

    obs.subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles.filter(v => v.isActive));
        this.offlineDb.saveVehicles(vehicles);   // update cache for next offline visit
        this.loadingVehicles.set(false);
      },
      error: () => {
        // Network failed even though navigator.onLine was true — try cache as fallback
        this.offlineDb.getCachedVehicles().then(cached => {
          if (cached.length > 0) {
            this.vehicles.set(cached.filter(v => v.isActive));
            this.snackBar.open('Offline — showing cached vehicles', 'OK', { duration: 3000 });
          } else {
            this.snackBar.open('Error loading vehicles', 'Close', { duration: 3000 });
          }
          this.loadingVehicles.set(false);
        });
      }
    });
  }

  updateTotal(): void {
    const qty   = this.form.get('quantityLiters')?.value ?? 0;
    const price = this.form.get('pricePerLiter')?.value  ?? 0;
    const total = qty && price ? Math.round(qty * price * 100) / 100 : 0;
    this.calculatedTotal.set(total);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value  = this.form.value;
    const date   = value.date as Date;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const request = {
      vehicleId:       value.vehicleId!,
      date:            dateStr,
      fuelType:        value.fuelType!,
      quantityLiters:  value.quantityLiters!,
      pricePerLiter:   value.pricePerLiter!,
      mileageAtRefuel: value.mileageAtRefuel!,
      location:        value.location || undefined
    };

    this.saving.set(true);

    // Offline: save to IndexedDB
    if (!navigator.onLine) {
      this.offlineDb.addPendingFuel(request).then(() => {
        this.saving.set(false);
        this.syncService.showOfflineSavedMessage();
        this.router.navigate(['/fuel']);
      });
      return;
    }

    this.fuelService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Record saved successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/fuel']);
      },
      error: (err) => {
        this.saving.set(false);
        // Fall back to offline storage on network error
        if (!navigator.onLine) {
          this.offlineDb.addPendingFuel(request).then(() => {
            this.syncService.showOfflineSavedMessage();
            this.router.navigate(['/fuel']);
          });
        } else {
          const msg = err?.error?.message || 'Error saving record';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        }
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    return 'Invalid value';
  }
}
