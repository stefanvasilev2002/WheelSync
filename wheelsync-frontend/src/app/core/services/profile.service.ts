import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { UserResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/profile`;

  getProfile(): Observable<UserResponse> {
    return this.http.get<ApiResponse<UserResponse>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  updateProfile(req: { firstName: string; lastName: string; phone?: string }): Observable<UserResponse> {
    return this.http.put<ApiResponse<UserResponse>>(this.baseUrl, req).pipe(
      map(res => res.data)
    );
  }

  changePassword(req: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/change-password`, req).pipe(
      map(() => void 0)
    );
  }
}
