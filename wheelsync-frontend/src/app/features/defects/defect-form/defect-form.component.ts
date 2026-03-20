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
  selectedPhoto = signal<File | null>(null);
  photoPreviewUrl = signal<string | null>(null);

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

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      this.snackBar.open('Only JPG/PNG images are allowed', 'Close', { duration: 3000 });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('Photo must be less than 10MB', 'Close', { duration: 3000 });
      return;
    }

    this.selectedPhoto.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.photoPreviewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.selectedPhoto.set(null);
    this.photoPreviewUrl.set(null);
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
      next: (defect) => {
        const photo = this.selectedPhoto();
        if (photo) {
          this.defectService.uploadPhoto(defect.id, photo).subscribe({
            next: () => this.finishSave(),
            error: () => {
              // Defect was created, photo upload failed — still navigate
              this.snackBar.open('Defect reported, but photo upload failed', 'Close', { duration: 4000 });
              this.router.navigate(['/defects']);
            }
          });
        } else {
          this.finishSave();
        }
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error reporting defect';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.snackBar.open('Defect reported successfully', 'Close', { duration: 3000 });
    this.router.navigate(['/defects']);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxlength']) return 'Too long';
    return 'Invalid value';
  }
}
