import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  ServiceRecordResponse,
  ServiceRecordRequest,
  ServiceDocumentResponse
} from '../models/service-record.model';

@Injectable({ providedIn: 'root' })
export class ServiceRecordService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/service-records`;

  getAll(): Observable<ServiceRecordResponse[]> {
    return this.http.get<ApiResponse<ServiceRecordResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getById(id: number): Observable<ServiceRecordResponse> {
    return this.http.get<ApiResponse<ServiceRecordResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(req: ServiceRecordRequest): Observable<ServiceRecordResponse> {
    return this.http.post<ApiResponse<ServiceRecordResponse>>(this.baseUrl, req).pipe(
      map(res => res.data)
    );
  }

  update(id: number, req: ServiceRecordRequest): Observable<ServiceRecordResponse> {
    return this.http.put<ApiResponse<ServiceRecordResponse>>(`${this.baseUrl}/${id}`, req).pipe(
      map(res => res.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  uploadDocument(serviceRecordId: number, file: File): Observable<ServiceDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ServiceDocumentResponse>>(
      `${this.baseUrl}/${serviceRecordId}/documents`, formData
    ).pipe(map(res => res.data));
  }

  downloadDocument(docId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${docId}/download`, {
      responseType: 'blob'
    });
  }

  deleteDocument(docId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/documents/${docId}`).pipe(
      map(() => undefined)
    );
  }
}
