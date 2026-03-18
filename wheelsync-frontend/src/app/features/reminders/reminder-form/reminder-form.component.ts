import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { ReminderService } from '../../../core/services/reminder.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { VehicleResponse } from '../../../core/models/vehicle.model';
import { MaintenanceReminderRequest } from '../../../core/models/reminder.model';

@Component({
  selector: 'ws-reminder-form',
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
  templateUrl: './reminder-form.component.html'
})
export class ReminderFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reminderService = inject(ReminderService);
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  vehicles = signal<VehicleResponse[]>([]);
  loading = signal(false);
  saving = signal(false);
  editId = signal<number | null>(null);
  intervalType = signal<'MILEAGE' | 'DATE'>('MILEAGE');

  readonly serviceTypes = [
    { value: 'OIL_CHANGE', label: 'Oil Change' },
    { value: 'FILTER_CHANGE', label: 'Filter Change' },
    { value: 'TIRE_CHANGE', label: 'Tire Change' },
    { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
    { value: 'TECHNICAL_INSPECTION', label: 'Technical Inspection' },
    { value: 'OTHER', label: 'Other' }
  ];

  readonly intervalTypes = [
    { value: 'MILEAGE', label: 'Mileage' },
    { value: 'DATE', label: 'Date' }
  ];

  form = this.fb.group({
    vehicleId:           [null as number | null, [Validators.required]],
    serviceType:         [null as string | null,  [Validators.required]],
    intervalType:        ['MILEAGE' as 'MILEAGE' | 'DATE', [Validators.required]],
    mileageInterval:     [null as number | null],
    dateIntervalMonths:  [null as number | null],
    lastServiceDate:     [null as Date | null],
    lastServiceMileage:  [null as number | null],
    warningThresholdKm:  [1000],
    warningThresholdDays:[14]
  });

  readonly isMileage = computed(() => this.intervalType() === 'MILEAGE');

  ngOnInit(): void {
    this.loadVehicles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.route.snapshot.url.some(s => s.path === 'edit')) {
      this.editId.set(Number(id));
      this.loadReminder(Number(id));
    }
    this.form.get('intervalType')?.valueChanges.subscribe((val) => {
      this.intervalType.set((val as 'MILEAGE' | 'DATE') ?? 'MILEAGE');
      this.form.get('mileageInterval')?.reset();
      this.form.get('dateIntervalMonths')?.reset();
      this.form.get('lastServiceMileage')?.reset();
      this.form.get('lastServiceDate')?.reset();
    });
  }

  loadVehicles(): void {
    this.vehicleService.getAll().subscribe({
      next: (v) => this.vehicles.set(v.filter(x => x.isActive)),
      error: () => this.snackBar.open('Error loading vehicles', 'Close', { duration: 3000 })
    });
  }

  loadReminder(id: number): void {
    this.loading.set(true);
    this.reminderService.getAll().subscribe({
      next: (reminders) => {
        const r = reminders.find(x => x.id === id);
        if (r) {
          this.intervalType.set(r.intervalType);
          this.form.patchValue({
            vehicleId: r.vehicleId,
            serviceType: r.serviceType,
            intervalType: r.intervalType,
            mileageInterval: r.mileageInterval,
            dateIntervalMonths: r.dateIntervalMonths,
            lastServiceDate: r.lastServiceDate ? new Date(r.lastServiceDate) : null,
            lastServiceMileage: r.lastServiceMileage,
            warningThresholdKm: r.warningThresholdKm,
            warningThresholdDays: r.warningThresholdDays
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading reminder', 'Close', { duration: 3000 });
        this.router.navigate(['/reminders']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const lastServiceDate = value.lastServiceDate as Date | null;
    let lastServiceDateStr: string | undefined;
    if (lastServiceDate) {
      lastServiceDateStr = `${lastServiceDate.getFullYear()}-${String(lastServiceDate.getMonth() + 1).padStart(2, '0')}-${String(lastServiceDate.getDate()).padStart(2, '0')}`;
    }

    const req: MaintenanceReminderRequest = {
      vehicleId: value.vehicleId!,
      serviceType: value.serviceType!,
      intervalType: value.intervalType as 'MILEAGE' | 'DATE',
      mileageInterval: value.mileageInterval ?? undefined,
      dateIntervalMonths: value.dateIntervalMonths ?? undefined,
      lastServiceDate: lastServiceDateStr,
      lastServiceMileage: value.lastServiceMileage ?? undefined,
      warningThresholdKm: value.warningThresholdKm ?? undefined,
      warningThresholdDays: value.warningThresholdDays ?? undefined
    };

    this.saving.set(true);
    const obs = this.editId()
      ? this.reminderService.update(this.editId()!, req)
      : this.reminderService.create(req);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Reminder saved successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/reminders']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error saving reminder';
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
