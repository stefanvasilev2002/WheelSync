import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component')
            .then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component')
            .then(m => m.ResetPasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // Vehicles
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent)
      },
      {
        path: 'vehicles/new',
        loadComponent: () =>
          import('./features/vehicles/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent)
      },
      {
        path: 'vehicles/:id',
        loadComponent: () =>
          import('./features/vehicles/vehicle-detail/vehicle-detail.component').then(m => m.VehicleDetailComponent)
      },
      {
        path: 'vehicles/:id/edit',
        loadComponent: () =>
          import('./features/vehicles/vehicle-form/vehicle-form.component').then(m => m.VehicleFormComponent)
      },
      {
        path: 'vehicles/:id/report',
        loadComponent: () =>
          import('./features/vehicles/vehicle-report/vehicle-report.component').then(m => m.VehicleReportComponent)
      },

      // Mileage
      {
        path: 'mileage',
        loadComponent: () =>
          import('./features/mileage/mileage-list/mileage-list.component').then(m => m.MileageListComponent)
      },
      {
        path: 'mileage/new',
        loadComponent: () =>
          import('./features/mileage/mileage-form/mileage-form.component').then(m => m.MileageFormComponent)
      },

      // Fuel
      {
        path: 'fuel',
        loadComponent: () =>
          import('./features/fuel/fuel-list/fuel-list.component').then(m => m.FuelListComponent)
      },
      {
        path: 'fuel/new',
        loadComponent: () =>
          import('./features/fuel/fuel-form/fuel-form.component').then(m => m.FuelFormComponent)
      },

      // Service Records
      {
        path: 'service-records',
        loadComponent: () =>
          import('./features/service-records/service-record-list/service-record-list.component')
            .then(m => m.ServiceRecordListComponent)
      },
      {
        path: 'service-records/new',
        loadComponent: () =>
          import('./features/service-records/service-record-form/service-record-form.component')
            .then(m => m.ServiceRecordFormComponent)
      },
      {
        path: 'service-records/:id/edit',
        loadComponent: () =>
          import('./features/service-records/service-record-form/service-record-form.component')
            .then(m => m.ServiceRecordFormComponent)
      },
      {
        path: 'service-records/:id',
        loadComponent: () =>
          import('./features/service-records/service-record-detail/service-record-detail.component')
            .then(m => m.ServiceRecordDetailComponent)
      },

      // Defects
      {
        path: 'defects',
        loadComponent: () =>
          import('./features/defects/defect-list/defect-list.component')
            .then(m => m.DefectListComponent)
      },
      {
        path: 'defects/new',
        loadComponent: () =>
          import('./features/defects/defect-form/defect-form.component')
            .then(m => m.DefectFormComponent)
      },

      // Reminders
      {
        path: 'reminders',
        loadComponent: () =>
          import('./features/reminders/reminder-list/reminder-list.component')
            .then(m => m.ReminderListComponent)
      },
      {
        path: 'reminders/new',
        loadComponent: () =>
          import('./features/reminders/reminder-form/reminder-form.component')
            .then(m => m.ReminderFormComponent)
      },
      {
        path: 'reminders/:id/edit',
        loadComponent: () =>
          import('./features/reminders/reminder-form/reminder-form.component')
            .then(m => m.ReminderFormComponent)
      },

      // Statistics
      {
        path: 'stats',
        loadComponent: () =>
          import('./features/stats/stats.component')
            .then(m => m.StatsComponent)
      },

      // Admin - Companies
      {
        path: 'admin/companies',
        loadComponent: () =>
          import('./features/admin/companies/company-list/company-list.component').then(m => m.CompanyListComponent)
      },
      {
        path: 'admin/companies/new',
        loadComponent: () =>
          import('./features/admin/companies/company-form/company-form.component').then(m => m.CompanyFormComponent)
      },
      {
        path: 'admin/companies/:id/edit',
        loadComponent: () =>
          import('./features/admin/companies/company-form/company-form.component').then(m => m.CompanyFormComponent)
      },

      // Admin - Users
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'admin/users/new',
        data: { createMode: true },
        loadComponent: () =>
          import('./features/admin/users/user-edit/user-edit.component').then(m => m.UserEditComponent)
      },
      {
        path: 'admin/users/:id/edit',
        loadComponent: () =>
          import('./features/admin/users/user-edit/user-edit.component').then(m => m.UserEditComponent)
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
