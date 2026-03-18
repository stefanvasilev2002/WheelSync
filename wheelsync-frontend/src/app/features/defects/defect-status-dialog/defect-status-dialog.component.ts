import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DefectResponse, DefectStatus, DefectStatusUpdateRequest } from '../../../core/models/defect.model';

@Component({
  selector: 'ws-defect-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './defect-status-dialog.component.html'
})
export class DefectStatusDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DefectStatusDialogComponent>);
  readonly defect: DefectResponse = inject(MAT_DIALOG_DATA);

  readonly statusOptions: { value: DefectStatus; label: string }[] = [
    { value: 'REPORTED', label: 'Reported' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' }
  ];

  form = this.fb.group({
    status: [this.defect.status as DefectStatus],
    resolutionNote: [this.defect.resolutionNote || ''],
    resolvedDate: [this.defect.resolvedDate ? new Date(this.defect.resolvedDate) : null as Date | null]
  });

  onSubmit(): void {
    const value = this.form.value;
    const resolvedDate = value.resolvedDate as Date | null;
    let resolvedDateStr: string | undefined;
    if (resolvedDate) {
      resolvedDateStr = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}-${String(resolvedDate.getDate()).padStart(2, '0')}`;
    }
    const result: DefectStatusUpdateRequest = {
      status: value.status as DefectStatus,
      resolutionNote: value.resolutionNote || undefined,
      resolvedDate: resolvedDateStr
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
