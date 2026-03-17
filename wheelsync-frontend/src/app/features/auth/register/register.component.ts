import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/api.model';
import { environment } from '../../../../environments/environment';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

interface CompanyOption { id: number; name: string; }

@Component({
  selector: 'ws-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  form: FormGroup;
  loading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};
  hidePassword = true;
  companies: CompanyOption[] = [];

  readonly roles = [
    { value: 'DRIVER', label: 'Возач' },
    { value: 'FLEET_MANAGER', label: 'Менаџер на флота' },
    { value: 'ADMIN', label: 'Администратор' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['DRIVER', Validators.required],
      companyId: [null],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.http.get<ApiResponse<CompanyOption[]>>(`${environment.apiUrl}/auth/companies`).subscribe({
      next: (res) => this.companies = res.data ?? [],
      error: () => this.companies = []
    });
  }

  get selectedRole(): string { return this.form.get('role')?.value; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.fieldErrors = {};

    const { confirmPassword, ...request } = this.form.value;
    if (!request.companyId) delete request.companyId;

    this.authService.register(request).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Настана грешка при регистрација';
        this.fieldErrors = err.error?.fieldErrors ?? {};
        if (err.status === 409) {
          this.form.get('email')?.setErrors({ serverError: this.errorMessage });
        }
      }
    });
  }

  get f() { return this.form.controls; }
}
