import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { CompanyService } from '../../../../core/services/company.service';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { UserResponse } from '../../../../core/models/user.model';

@Component({
  selector: 'ws-company-form',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss'
})
export class CompanyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly userManagementService = inject(UserManagementService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  editId = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  fleetManagers = signal<UserResponse[]>([]);

  get isEditMode(): boolean {
    return this.editId() !== null;
  }

  form = this.fb.group({
    name:          ['', [Validators.required]],
    address:       [''],
    phone:         [''],
    contactPerson: [''],
    managerId:     [null as number | null]
  });

  ngOnInit(): void {
    this.userManagementService.getUnassignedFleetManagers().subscribe({
      next: (fms) => this.fleetManagers.set(fms),
      error: () => {}
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.loadCompany(id);
    }
  }

  loadCompany(id: number): void {
    this.loading.set(true);
    this.companyService.getById(id).subscribe({
      next: (company) => {
        this.form.patchValue({
          name:          company.name,
          address:       company.address,
          phone:         company.phone,
          contactPerson: company.contactPerson
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading company', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/companies']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const request = {
      name:          value.name!,
      address:       value.address || undefined,
      phone:         value.phone   || undefined,
      contactPerson: value.contactPerson || undefined,
      managerId:     value.managerId || undefined
    };

    this.saving.set(true);

    const operation = this.isEditMode
      ? this.companyService.update(this.editId()!, request)
      : this.companyService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        const msg = this.isEditMode
          ? 'Company updated successfully'
          : 'Company created successfully';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/companies']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Error saving company';
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
