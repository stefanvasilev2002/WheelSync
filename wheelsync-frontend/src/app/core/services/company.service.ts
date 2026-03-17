import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { CompanyResponse, CompanyRequest } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/companies`;

  getAll(): Observable<CompanyResponse[]> {
    return this.http.get<ApiResponse<CompanyResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getById(id: number): Observable<CompanyResponse> {
    return this.http.get<ApiResponse<CompanyResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(request: CompanyRequest): Observable<CompanyResponse> {
    return this.http.post<ApiResponse<CompanyResponse>>(this.baseUrl, request).pipe(
      map(res => res.data)
    );
  }

  update(id: number, request: CompanyRequest): Observable<CompanyResponse> {
    return this.http.put<ApiResponse<CompanyResponse>>(`${this.baseUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
