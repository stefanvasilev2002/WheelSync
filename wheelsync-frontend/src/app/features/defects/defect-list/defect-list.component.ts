import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DefectService } from '../../../core/services/defect.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  DefectResponse,
  DefectStatusUpdateRequest,
  PRIORITY_LABELS,
  DEFECT_STATUS_LABELS
} from '../../../core/models/defect.model';
import { DefectStatusDialogComponent } from '../defect-status-dialog/defect-status-dialog.component';

@Component({
  selector: 'ws-defect-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './defect-list.component.html'
})
export class DefectListComponent implements OnInit {
  private readonly defectService = inject(DefectService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  defects = signal<DefectResponse[]>([]);
  loading = signal(false);

  readonly isManager = computed(() =>
    this.authService.isAdmin() || this.authService.isManager()
  );

  readonly priorityLabels = PRIORITY_LABELS;
  readonly statusLabels = DEFECT_STATUS_LABELS;

  readonly displayedColumns = ['vehicle', 'title', 'priority', 'status', 'reportedBy', 'date', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.defectService.getAll().subscribe({
      next: (data) => {
        this.defects.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading defects', 'Close', { duration: 3000 });
      }
    });
  }

  openStatusDialog(defect: DefectResponse): void {
    const ref = this.dialog.open(DefectStatusDialogComponent, {
      width: '420px',
      data: defect
    });
    ref.afterClosed().subscribe((result: DefectStatusUpdateRequest | undefined) => {
      if (result) {
        this.defectService.updateStatus(defect.id, result).subscribe({
          next: () => {
            this.snackBar.open('Defect status updated', 'Close', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Error updating status', 'Close', { duration: 3000 })
        });
      }
    });
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red' };
    return map[priority] || '';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = { REPORTED: 'red', IN_PROGRESS: 'orange', RESOLVED: 'green' };
    return map[status] || '';
  }
}
