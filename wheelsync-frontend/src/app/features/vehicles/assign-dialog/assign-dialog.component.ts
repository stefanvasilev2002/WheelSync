import { Component, OnInit, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserManagementService } from '../../../core/services/user-management.service';
import { UserResponse } from '../../../core/models/user.model';

export interface AssignDialogData {
  vehicleId: number;
  vehicleDisplayName: string;
  companyId: number;
}

@Component({
  selector: 'ws-assign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './assign-dialog.component.html',
  styleUrl: './assign-dialog.component.scss'
})
export class AssignDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserManagementService);
  readonly dialogRef = inject(MatDialogRef<AssignDialogComponent>);

  drivers = signal<UserResponse[]>([]);
  loadingDrivers = signal(false);

  form = this.fb.group({
    driverId: [null as number | null, [Validators.required]],
    assignedDate: [new Date(), [Validators.required]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: AssignDialogData) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.loadingDrivers.set(true);
    this.userService.getDriversByCompany().subscribe({
      next: (users) => {
        this.drivers.set(users);
        this.loadingDrivers.set(false);
      },
      error: () => this.loadingDrivers.set(false)
    });
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const date = value.assignedDate as Date;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.dialogRef.close({
      driverId: value.driverId!,
      assignedDate: dateStr
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
