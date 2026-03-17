import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'ws-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <h1>Добредојдовте, {{ auth.currentUser()?.firstName }}!</h1>
      <p class="text-muted">WheelSync - Систем за управување со возен парк</p>
      <mat-card style="margin-top: 24px; padding: 24px; text-align: center;">
        <mat-icon style="font-size: 64px; height: 64px; width: 64px; color: #1a237e;">
          directions_car
        </mat-icon>
        <h2>Dashboard — фаза 2</h2>
        <p class="text-muted">Содржината ќе биде додадена во следната фаза.</p>
      </mat-card>
    </div>
  `
})
export class DashboardComponent {
  constructor(public auth: AuthService) {}
}
