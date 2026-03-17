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
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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
    this.vehicleService.getAll().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles.filter(v => v.isActive));
        this.loadingVehicles.set(false);
      },
      error: () => {
        this.loadingVehicles.set(false);
        this.snackBar.open('Грешка при вчитување на возилата', 'Затвори', { duration: 3000 });
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

    this.saving.set(true);
    this.fuelService.create({
      vehicleId:       value.vehicleId!,
      date:            dateStr,
      fuelType:        value.fuelType!,
      quantityLiters:  value.quantityLiters!,
      pricePerLiter:   value.pricePerLiter!,
      mileageAtRefuel: value.mileageAtRefuel!,
      location:        value.location || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Записот е успешно зачуван', 'Затвори', { duration: 3000 });
        this.router.navigate(['/fuel']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Грешка при зачувување';
        this.snackBar.open(msg, 'Затвори', { duration: 4000 });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Ова поле е задолжително';
    if (control.errors['min']) return `Минималната вредност е ${control.errors['min'].min}`;
    return 'Невалидна вредност';
  }
}
