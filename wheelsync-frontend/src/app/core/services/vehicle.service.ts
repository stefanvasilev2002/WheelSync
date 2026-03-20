import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  VehicleResponse,
  VehicleRequest,
  VehicleAssignmentResponse,
  AssignVehicleRequest
} from '../models/vehicle.model';
import { VehicleReportResponse } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicles`;

  getAll(): Observable<VehicleResponse[]> {
    return this.http.get<ApiResponse<VehicleResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  search(make?: string, model?: string): Observable<VehicleResponse[]> {
    let params = new HttpParams();
    if (make) params = params.set('make', make);
    if (model) params = params.set('model', model);
    return this.http.get<ApiResponse<VehicleResponse[]>>(`${this.baseUrl}/search`, { params }).pipe(
      map(res => res.data)
    );
  }

  getById(id: number): Observable<VehicleResponse> {
    return this.http.get<ApiResponse<VehicleResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(request: VehicleRequest): Observable<VehicleResponse> {
    return this.http.post<ApiResponse<VehicleResponse>>(this.baseUrl, request).pipe(
      map(res => res.data)
    );
  }

  update(id: number, request: VehicleRequest): Observable<VehicleResponse> {
    return this.http.put<ApiResponse<VehicleResponse>>(`${this.baseUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  assign(vehicleId: number, request: AssignVehicleRequest): Observable<VehicleAssignmentResponse> {
    return this.http.post<ApiResponse<VehicleAssignmentResponse>>(
      `${this.baseUrl}/${vehicleId}/assign`, request
    ).pipe(map(res => res.data));
  }

  unassign(vehicleId: number): Observable<VehicleAssignmentResponse> {
    return this.http.delete<ApiResponse<VehicleAssignmentResponse>>(
      `${this.baseUrl}/${vehicleId}/assign`
    ).pipe(map(res => res.data));
  }

  getAssignmentHistory(vehicleId: number): Observable<VehicleAssignmentResponse[]> {
    return this.http.get<ApiResponse<VehicleAssignmentResponse[]>>(
      `${this.baseUrl}/${vehicleId}/assignments`
    ).pipe(map(res => res.data));
  }

  getActiveAssignment(vehicleId: number): Observable<VehicleAssignmentResponse | null> {
    return this.http.get<ApiResponse<VehicleAssignmentResponse | null>>(
      `${this.baseUrl}/${vehicleId}/assignment`
    ).pipe(map(res => res.data));
  }

  getMyVehicles(): Observable<VehicleResponse[]> {
    return this.http.get<ApiResponse<VehicleResponse[]>>(`${this.baseUrl}/my`).pipe(
      map(res => res.data)
    );
  }

  getReport(id: number): Observable<VehicleReportResponse> {
    return this.http.get<ApiResponse<VehicleReportResponse>>(`${this.baseUrl}/${id}/report`).pipe(
      map(res => res.data)
    );
  }
}
