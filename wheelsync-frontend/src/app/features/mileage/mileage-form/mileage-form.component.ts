import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { MileageService } from '../../../core/services/mileage.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { VehicleResponse } from '../../../core/models/vehicle.model';

@Component({
  selector: 'ws-mileage-form',
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
  templateUrl: './mileage-form.component.html',
  styleUrl: './mileage-form.component.scss'
})
export class MileageFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mileageService = inject(MileageService);
  private readonly vehicleService = inject(VehicleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  vehicles = signal<VehicleResponse[]>([]);
  loadingVehicles = signal(false);
  saving = signal(false);

  readonly calculatedDistance = signal(0);

  form = this.fb.group({
    vehicleId: [null as number | null, [Validators.required]],
    date: [new Date(), [Validators.required]],
    startMileage: [null as number | null, [Validators.required, Validators.min(0)]],
    endMileage: [null as number | null, [Validators.required, Validators.min(0)]],
    note: ['']
  });

  ngOnInit(): void {
    this.loadVehicles();
    this.form.get('startMileage')?.valueChanges.subscribe(() => this.updateDistance());
    this.form.get('endMileage')?.valueChanges.subscribe(() => this.updateDistance());
  }

  loadVehicles(): void {
    this.loadingVehicles.set(true);
    const obs = this.vehicleService.getAll();
    obs.subscribe({
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

  updateDistance(): void {
    const start = this.form.get('startMileage')?.value ?? 0;
    const end = this.form.get('endMileage')?.value ?? 0;
    const dist = end && start ? Math.max(0, end - start) : 0;
    this.calculatedDistance.set(dist);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const date = value.date as Date;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    this.saving.set(true);
    this.mileageService.create({
      vehicleId: value.vehicleId!,
      date: dateStr,
      startMileage: value.startMileage!,
      endMileage: value.endMileage!,
      note: value.note || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Записот е успешно зачуван', 'Затвори', { duration: 3000 });
        this.router.navigate(['/mileage']);
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
