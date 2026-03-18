import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { UserResponse } from '../../../../core/models/user.model';
import { Role } from '../../../../core/models/auth.model';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:         'Administrator',
  FLEET_MANAGER: 'Manager',
  DRIVER:        'Driver'
};

@Component({
  selector: 'ws-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserManagementService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  allUsers = signal<UserResponse[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  readonly roleLabels = ROLE_LABELS;

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allUsers();
    return this.allUsers().filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.companyName ?? '').toLowerCase().includes(query)
    );
  });

  displayedColumns = ['name', 'email', 'role', 'company', 'status', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  editUser(id: number): void {
    this.router.navigate(['/admin/users', id, 'edit']);
  }

  deactivateUser(user: UserResponse): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} the user "${user.firstName} ${user.lastName}"?`
    );
    if (!confirmed) return;

    this.userService.deactivate(user.id).subscribe({
      next: () => {
        this.snackBar.open('User status updated', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error updating user';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  getRoleLabel(role: Role): string {
    return ROLE_LABELS[role] ?? role;
  }
}
