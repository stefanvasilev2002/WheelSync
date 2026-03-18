import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceRecordService } from '../../../core/services/service-record.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ServiceRecordResponse,
  ServiceDocumentResponse,
  SERVICE_TYPE_LABELS,
  SERVICE_RECORD_STATUS_LABELS
} from '../../../core/models/service-record.model';

@Component({
  selector: 'ws-service-record-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './service-record-detail.component.html'
})
export class ServiceRecordDetailComponent implements OnInit {
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  record = signal<ServiceRecordResponse | null>(null);
  loading = signal(false);
  uploading = signal(false);
  selectedFile = signal<File | null>(null);

  readonly serviceTypeLabels = SERVICE_TYPE_LABELS;
  readonly statusLabels = SERVICE_RECORD_STATUS_LABELS;

  readonly isManager = signal(
    this.authService.isAdmin() || this.authService.isManager()
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRecord(id);
  }

  loadRecord(id: number): void {
    this.loading.set(true);
    this.serviceRecordService.getById(id).subscribe({
      next: (data) => {
        this.record.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading record', 'Close', { duration: 3000 });
        this.router.navigate(['/service-records']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile.set(input.files[0]);
    }
  }

  uploadDocument(): void {
    const file = this.selectedFile();
    const rec = this.record();
    if (!file || !rec) return;

    this.uploading.set(true);
    this.serviceRecordService.uploadDocument(rec.id, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.selectedFile.set(null);
        this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
        this.loadRecord(rec.id);
      },
      error: (err) => {
        this.uploading.set(false);
        const msg = err?.error?.message || 'Error uploading document';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  downloadDocument(doc: ServiceDocumentResponse): void {
    this.serviceRecordService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error downloading document', 'Close', { duration: 3000 })
    });
  }

  deleteDocument(docId: number): void {
    if (!confirm('Delete this document?')) return;
    const rec = this.record();
    if (!rec) return;

    this.serviceRecordService.deleteDocument(docId).subscribe({
      next: () => {
        this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
        this.loadRecord(rec.id);
      },
      error: () => this.snackBar.open('Error deleting document', 'Close', { duration: 3000 })
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
