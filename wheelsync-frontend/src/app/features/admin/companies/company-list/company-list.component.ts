import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyService } from '../../../../core/services/company.service';
import { CompanyResponse } from '../../../../core/models/company.model';

@Component({
  selector: 'ws-company-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss'
})
export class CompanyListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  companies = signal<CompanyResponse[]>([]);
  loading = signal(false);

  displayedColumns = ['name', 'contactPerson', 'phone', 'userCount', 'vehicleCount', 'actions'];

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.companyService.getAll().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Грешка при вчитување на компаниите', 'Затвори', { duration: 3000 });
      }
    });
  }

  addCompany(): void {
    this.router.navigate(['/admin/companies/new']);
  }

  editCompany(id: number): void {
    this.router.navigate(['/admin/companies', id, 'edit']);
  }

  deleteCompany(company: CompanyResponse): void {
    const confirmed = window.confirm(
      `Дали сте сигурни дека сакате да ја избришете компанијата „${company.name}"?`
    );
    if (!confirmed) return;

    this.companyService.delete(company.id).subscribe({
      next: () => {
        this.snackBar.open('Компанијата е успешно избришана', 'Затвори', { duration: 3000 });
        this.loadCompanies();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Грешка при бришење на компанијата';
        this.snackBar.open(msg, 'Затвори', { duration: 4000 });
      }
    });
  }
}
