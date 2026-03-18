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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { CompanyService } from '../../../../core/services/company.service';
import { CompanyResponse } from '../../../../core/models/company.model';
import { Role } from '../../../../core/models/auth.model';

@Component({
  selector: 'ws-user-edit',
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
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss'
})
export class UserEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserManagementService);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  userId = signal<number>(0);
  companies = signal<CompanyResponse[]>([]);
  loading = signal(false);
  saving = signal(false);

  readonly roles: { value: Role; label: string }[] = [
    { value: 'ADMIN',         label: 'Administrator' },
    { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
    { value: 'DRIVER',        label: 'Driver' }
  ];

  form = this.fb.group({
    firstName: ['',  [Validators.required]],
    lastName:  ['',  [Validators.required]],
    phone:     [''],
    role:      [null as Role | null, [Validators.required]],
    companyId: [null as number | null],
    isActive:  [true]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/admin/users']);
      return;
    }
    this.userId.set(Number(idParam));
    this.loadCompanies();
    this.loadUser();
  }

  loadCompanies(): void {
    this.companyService.getAll().subscribe({
      next: (companies) => this.companies.set(companies),
      error: () => this.snackBar.open('Error loading companies', 'Close', { duration: 3000 })
    });
  }

  loadUser(): void {
    this.loading.set(true);
    this.userService.getById(this.userId()).subscribe({
      next: (user) => {
        this.form.patchValue({
          firstName: user.firstName,
          lastName:  user.lastName,
          phone:     user.phone,
          role:      user.role,
          companyId: user.companyId,
          isActive:  user.isActive
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading user', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    this.saving.set(true);

    this.userService.update(this.userId(), {
      firstName: value.firstName!,
      lastName:  value.lastName!,
      phone:     value.phone   || undefined,
      role:      value.role!,
      companyId: value.companyId ?? null,
      isActive:  value.isActive ?? true
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error saving changes';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'This field is required';
    return 'Invalid value';
  }
}
