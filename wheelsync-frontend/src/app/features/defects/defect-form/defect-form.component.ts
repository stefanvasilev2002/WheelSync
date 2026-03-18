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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DefectService } from '../../../core/services/defect.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { VehicleResponse } from '../../../core/models/vehicle.model';
import { DefectPriority } from '../../../core/models/defect.model';

@Component({
  selector: 'ws-defect-form',
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
    MatSnackBarModule
  ],
  templateUrl: './defect-form.component.html'
})
export class DefectFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly defectService = inject(DefectService);
  private readonly vehicleService = inject(VehicleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  vehicles = signal<VehicleResponse[]>([]);
  saving = signal(false);

  readonly priorities: { value: DefectPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }
  ];

  form = this.fb.group({
    vehicleId: [null as number | null, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    priority: [null as DefectPriority | null, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    const obs = this.authService.isDriver()
      ? this.vehicleService.getMyVehicles()
      : this.vehicleService.getAll();
    obs.subscribe({
      next: (vehicles) => this.vehicles.set(vehicles.filter(v => v.isActive)),
      error: () => this.snackBar.open('Error loading vehicles', 'Close', { duration: 3000 })
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    this.saving.set(true);
    this.defectService.create({
      vehicleId: value.vehicleId!,
      title: value.title!,
      description: value.description || undefined,
      priority: value.priority!
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Defect reported successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/defects']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error reporting defect';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxlength']) return 'Too long';
    return 'Invalid value';
  }
}
