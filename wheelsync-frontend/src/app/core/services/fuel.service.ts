import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { FuelLogResponse, FuelLogRequest } from '../models/fuel.model';

@Injectable({ providedIn: 'root' })
export class FuelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fuel`;

  getMyLogs(): Observable<FuelLogResponse[]> {
    return this.http.get<ApiResponse<FuelLogResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getAll(): Observable<FuelLogResponse[]> {
    return this.getMyLogs();
  }

  getByVehicle(vehicleId: number): Observable<FuelLogResponse[]> {
    return this.http.get<ApiResponse<FuelLogResponse[]>>(
      `${this.baseUrl}/vehicle/${vehicleId}`
    ).pipe(map(res => res.data));
  }

  create(request: FuelLogRequest): Observable<FuelLogResponse> {
    return this.http.post<ApiResponse<FuelLogResponse>>(this.baseUrl, request).pipe(
      map(res => res.data)
    );
  }
}
