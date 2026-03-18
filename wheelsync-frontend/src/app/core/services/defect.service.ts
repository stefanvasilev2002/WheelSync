import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  DefectResponse,
  DefectRequest,
  DefectStatusUpdateRequest
} from '../models/defect.model';

@Injectable({ providedIn: 'root' })
export class DefectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/defects`;

  getAll(): Observable<DefectResponse[]> {
    return this.http.get<ApiResponse<DefectResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getById(id: number): Observable<DefectResponse> {
    return this.http.get<ApiResponse<DefectResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(req: DefectRequest): Observable<DefectResponse> {
    return this.http.post<ApiResponse<DefectResponse>>(this.baseUrl, req).pipe(
      map(res => res.data)
    );
  }

  updateStatus(id: number, req: DefectStatusUpdateRequest): Observable<DefectResponse> {
    return this.http.patch<ApiResponse<DefectResponse>>(`${this.baseUrl}/${id}/status`, req).pipe(
      map(res => res.data)
    );
  }
}
