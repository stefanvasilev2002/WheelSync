import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import {
  LoginRequest, RegisterRequest, ForgotPasswordRequest,
  ResetPasswordRequest, AuthResponse, Role
} from '../models/auth.model';
import { ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private _currentUser = signal<AuthResponse | null>(
    this.tokenService.getUser()
  );

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly role = computed(() => this._currentUser()?.role ?? null);
  readonly companyId = computed(() => this._currentUser()?.companyId ?? null);

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {}

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap(res => this.handleAuth(res.data))
    );
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request).pipe(
      tap(res => this.handleAuth(res.data))
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, request);
  }

  logout(): void {
    this.tokenService.clear();
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  hasRole(...roles: Role[]): boolean {
    const current = this._currentUser()?.role;
    return !!current && roles.includes(current);
  }

  isAdmin(): boolean    { return this.hasRole('ADMIN'); }
  isManager(): boolean  { return this.hasRole('FLEET_MANAGER'); }
  isDriver(): boolean   { return this.hasRole('DRIVER'); }

  private handleAuth(data: AuthResponse): void {
    this.tokenService.saveToken(data.token);
    this.tokenService.saveUser(data);
    this._currentUser.set(data);
  }
}
