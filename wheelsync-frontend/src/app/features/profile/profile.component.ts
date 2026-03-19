import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ProfileService } from '../../core/services/profile.service';
import { UserResponse } from '../../core/models/user.model';
import { Role } from '../../core/models/auth.model';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  if (!newPassword || !confirmPassword) return null;
  if (newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  if (confirmPassword.hasError('passwordMismatch')) {
    confirmPassword.setErrors(null);
  }
  return null;
}

@Component({
  selector: 'ws-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  profile = signal<UserResponse | null>(null);
  editMode = signal(false);
  saving = signal(false);
  changingPassword = signal(false);
  loading = signal(true);

  readonly roleLabelMap: Record<Role, string> = {
    ADMIN: 'Administrator',
    FLEET_MANAGER: 'Fleet Manager',
    DRIVER: 'Driver'
  };

  profileForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName:  ['', [Validators.required]],
    phone:     ['']
  });

  passwordForm = this.fb.group({
    currentPassword:  ['', [Validators.required]],
    newPassword:      ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword:  ['', [Validators.required]]
  }, { validators: passwordsMatchValidator });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.profileService.getProfile().subscribe({
      next: (user) => {
        this.profile.set(user);
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName:  user.lastName,
          phone:     user.phone ?? ''
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading profile', 'Close', { duration: 3000 });
      }
    });
  }

  enterEditMode(): void {
    const user = this.profile();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone ?? ''
      });
    }
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.profileForm.markAsUntouched();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.value;
    this.saving.set(true);
    this.profileService.updateProfile({
      firstName: value.firstName!,
      lastName:  value.lastName!,
      phone:     value.phone || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editMode.set(false);
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        this.profileService.getProfile().subscribe({
          next: (user) => this.profile.set(user)
        });
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error saving profile';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const value = this.passwordForm.value;
    this.changingPassword.set(true);
    this.profileService.changePassword({
      currentPassword: value.currentPassword!,
      newPassword:     value.newPassword!
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordForm.reset();
        this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.changingPassword.set(false);
        const msg = err?.error?.message || 'Error changing password';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  getRoleLabel(role: Role | undefined): string {
    if (!role) return '';
    return this.roleLabelMap[role] ?? role;
  }

  getAvatarLetter(): string {
    return this.profile()?.firstName?.charAt(0)?.toUpperCase() ?? '?';
  }

  getFieldError(form: 'profile' | 'password', field: string): string {
    const control = form === 'profile'
      ? this.profileForm.get(field)
      : this.passwordForm.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['passwordMismatch']) return 'Passwords do not match';
    return 'Invalid value';
  }
}
