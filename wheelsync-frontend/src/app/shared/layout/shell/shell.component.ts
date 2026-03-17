import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'ws-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {

  private isMobile = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');
  sidenavOpened = computed(() => !this.isMobile());

  readonly navItems: NavItem[] = [
    { label: 'Почетна', icon: 'dashboard', route: '/dashboard' },
    { label: 'Возила', icon: 'directions_car', route: '/vehicles',
      roles: ['ADMIN', 'FLEET_MANAGER'] },
    { label: 'Мои возила', icon: 'car_rental', route: '/my-vehicles',
      roles: ['DRIVER'] },
    { label: 'Километри', icon: 'speed', route: '/mileage',
      roles: ['DRIVER', 'FLEET_MANAGER'] },
    { label: 'Танкирања', icon: 'local_gas_station', route: '/fuel',
      roles: ['DRIVER', 'FLEET_MANAGER'] },
    { label: 'Сервиси', icon: 'build', route: '/services',
      roles: ['FLEET_MANAGER'] },
    { label: 'Дефекти', icon: 'report_problem', route: '/defects' },
    { label: 'Потсетници', icon: 'notifications', route: '/reminders',
      roles: ['FLEET_MANAGER'] },
    { label: 'Статистики', icon: 'bar_chart', route: '/statistics',
      roles: ['FLEET_MANAGER'] },
    { label: 'Компании', icon: 'business', route: '/admin/companies',
      roles: ['ADMIN'] },
    { label: 'Корисници', icon: 'people', route: '/admin/users',
      roles: ['ADMIN'] },
  ];

  visibleNavItems = computed(() => {
    const role = this.authService.role();
    return this.navItems.filter(item =>
      !item.roles || (role && item.roles.includes(role))
    );
  });

  currentUser = this.authService.currentUser;

  constructor(
    private authService: AuthService,
    private breakpointObserver: BreakpointObserver
  ) {}

  logout(): void {
    this.authService.logout();
  }
}
