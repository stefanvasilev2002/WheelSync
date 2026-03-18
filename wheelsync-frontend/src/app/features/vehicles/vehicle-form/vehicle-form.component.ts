import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { FuelType, FUEL_TYPE_LABELS } from '../../../core/models/vehicle.model';
import { CompanyResponse } from '../../../core/models/company.model';

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
  private readonly companyService = inject(CompanyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  vehicleId = signal<number | null>(null);
  companies = signal<CompanyResponse[]>([]);

  readonly isAdmin = () => this.authService.isAdmin();
  readonly isEditMode = () => this.vehicleId() !== null;

  readonly fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'PETROL', label: 'Petrol' },
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'LPG', label: 'LPG' },
    { value: 'ELECTRIC', label: 'Electric' },
    { value: 'HYBRID', label: 'Hybrid' }
  ];

  form = this.fb.group({
    companyId: [null as number | null],
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
    if (this.authService.isAdmin()) {
      this.companyService.getAll().subscribe({
        next: (list) => this.companies.set(list),
        error: () => {}
      });
    }

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
          companyId: vehicle.companyId,
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
        this.snackBar.open('Error loading vehicle', 'Close', { duration: 3000 });
        this.router.navigate(['/vehicles']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.authService.isAdmin() && !this.form.value.companyId) {
      this.snackBar.open('Please select a company for the vehicle', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const value = this.form.value;
    const request: any = {
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
    if (this.authService.isAdmin() && value.companyId) {
      request.companyId = value.companyId;
    }

    const op = this.isEditMode()
      ? this.vehicleService.update(this.vehicleId()!, request)
      : this.vehicleService.create(request);

    op.subscribe({
      next: (vehicle) => {
        this.saving.set(false);
        const msg = this.isEditMode() ? 'Vehicle updated successfully' : 'Vehicle added successfully';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.router.navigate(['/vehicles', vehicle.id]);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error saving vehicle';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;
    return 'Invalid value';
  }
}
