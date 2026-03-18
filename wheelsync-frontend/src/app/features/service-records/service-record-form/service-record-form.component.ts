import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
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
import { ServiceRecordService } from '../../../core/services/service-record.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { VehicleResponse } from '../../../core/models/vehicle.model';
import { ServiceType, ServiceRecordStatus } from '../../../core/models/service-record.model';

@Component({
  selector: 'ws-service-record-form',
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
  templateUrl: './service-record-form.component.html'
})
export class ServiceRecordFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  vehicles = signal<VehicleResponse[]>([]);
  loading = signal(false);
  saving = signal(false);
  editId = signal<number | null>(null);

  readonly serviceTypes: { value: ServiceType; label: string }[] = [
    { value: 'OIL_CHANGE', label: 'Oil Change' },
    { value: 'FILTER_CHANGE', label: 'Filter Change' },
    { value: 'TIRE_CHANGE', label: 'Tire Change' },
    { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
    { value: 'TECHNICAL_INSPECTION', label: 'Technical Inspection' },
    { value: 'OTHER', label: 'Other' }
  ];

  readonly statusOptions: { value: ServiceRecordStatus; label: string }[] = [
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PENDING', label: 'Pending' }
  ];

  form = this.fb.group({
    vehicleId: [null as number | null, [Validators.required]],
    serviceType: [null as ServiceType | null, [Validators.required]],
    date: [new Date(), [Validators.required]],
    mileage: [null as number | null, [Validators.required, Validators.min(0)]],
    location: [''],
    cost: [null as number | null, [Validators.required, Validators.min(0)]],
    description: [''],
    status: ['CONFIRMED' as ServiceRecordStatus]
  });

  ngOnInit(): void {
    this.loadVehicles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.route.snapshot.url.some(s => s.path === 'edit')) {
      this.editId.set(Number(id));
      this.loadRecord(Number(id));
    }
  }

  loadVehicles(): void {
    this.vehicleService.getAll().subscribe({
      next: (vehicles) => this.vehicles.set(vehicles.filter(v => v.isActive)),
      error: () => this.snackBar.open('Error loading vehicles', 'Close', { duration: 3000 })
    });
  }

  loadRecord(id: number): void {
    this.loading.set(true);
    this.serviceRecordService.getById(id).subscribe({
      next: (record) => {
        this.form.patchValue({
          vehicleId: record.vehicleId,
          serviceType: record.serviceType,
          date: new Date(record.date),
          mileage: record.mileage,
          location: record.location || '',
          cost: record.cost,
          description: record.description || '',
          status: record.status
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading record', 'Close', { duration: 3000 });
        this.router.navigate(['/service-records']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const date = value.date as Date;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const req = {
      vehicleId: value.vehicleId!,
      serviceType: value.serviceType!,
      date: dateStr,
      mileage: value.mileage!,
      location: value.location || undefined,
      cost: value.cost!,
      description: value.description || undefined,
      status: value.status as ServiceRecordStatus
    };

    this.saving.set(true);
    const obs = this.editId()
      ? this.serviceRecordService.update(this.editId()!, req)
      : this.serviceRecordService.create(req);

    obs.subscribe({
      next: (record) => {
        this.saving.set(false);
        this.snackBar.open('Service record saved successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/service-records', record.id]);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error saving record';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    return 'Invalid value';
  }
}
