import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { UserResponse, UserUpdateRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getAll(): Observable<UserResponse[]> {
    return this.http.get<ApiResponse<UserResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getDriversByCompany(): Observable<UserResponse[]> {
    return this.getAll().pipe(
      map(users => users.filter(u => u.role === 'DRIVER' && u.isActive))
    );
  }

  getById(id: number): Observable<UserResponse> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  update(id: number, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}
