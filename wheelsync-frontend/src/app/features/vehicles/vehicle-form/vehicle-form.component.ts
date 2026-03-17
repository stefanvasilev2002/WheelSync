import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { VehicleService } from '../../../core/services/vehicle.service';
import { FuelType, FUEL_TYPE_LABELS } from '../../../core/models/vehicle.model';

@Component({
  selector: 'ws-vehicle-form',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss'
})
export class VehicleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  vehicleId = signal<number | null>(null);

  readonly isEditMode = () => this.vehicleId() !== null;

  readonly fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'PETROL', label: 'Бензин' },
    { value: 'DIESEL', label: 'Дизел' },
    { value: 'LPG', label: 'Автогас' },
    { value: 'ELECTRIC', label: 'Електричен' },
    { value: 'HYBRID', label: 'Хибрид' }
  ];

  form = this.fb.group({
    make: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    model: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
    vin: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]],
    licensePlate: ['', [Validators.required, Validators.maxLength(20)]],
    color: ['', [Validators.maxLength(30)]],
    engineType: ['', [Validators.maxLength(50)]],
    fuelType: ['PETROL' as FuelType, [Validators.required]],
    currentMileage: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && !isNaN(+idParam)) {
      this.vehicleId.set(+idParam);
      this.loadVehicle(+idParam);
    }
  }

  loadVehicle(id: number): void {
    this.loading.set(true);
    this.vehicleService.getById(id).subscribe({
      next: (vehicle) => {
        this.form.patchValue({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          color: vehicle.color,
          engineType: vehicle.engineType,
          fuelType: vehicle.fuelType,
          currentMileage: vehicle.currentMileage
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Грешка при вчитување на возилото', 'Затвори', { duration: 3000 });
        this.router.navigate(['/vehicles']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.value;
    const request = {
      make: value.make!,
      model: value.model!,
      year: value.year!,
      vin: value.vin!,
      licensePlate: value.licensePlate!,
      color: value.color || undefined,
      engineType: value.engineType || undefined,
      fuelType: value.fuelType as FuelType,
      currentMileage: value.currentMileage!
    };

    const op = this.isEditMode()
      ? this.vehicleService.update(this.vehicleId()!, request)
      : this.vehicleService.create(request);

    op.subscribe({
      next: (vehicle) => {
        this.saving.set(false);
        const msg = this.isEditMode() ? 'Возилото е успешно ажурирано' : 'Возилото е успешно додадено';
        this.snackBar.open(msg, 'Затвори', { duration: 3000 });
        this.router.navigate(['/vehicles', vehicle.id]);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Грешка при зачувување на возилото';
        this.snackBar.open(msg, 'Затвори', { duration: 4000 });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Ова поле е задолжително';
    if (control.errors['minlength']) return `Минимум ${control.errors['minlength'].requiredLength} карактери`;
    if (control.errors['maxlength']) return `Максимум ${control.errors['maxlength'].requiredLength} карактери`;
    if (control.errors['min']) return `Минималната вредност е ${control.errors['min'].min}`;
    if (control.errors['max']) return `Максималната вредност е ${control.errors['max'].max}`;
    return 'Невалидна вредност';
  }
}
