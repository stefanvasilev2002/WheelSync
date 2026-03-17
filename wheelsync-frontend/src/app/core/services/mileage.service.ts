import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { MileageLogResponse, MileageLogRequest } from '../models/mileage.model';

@Injectable({ providedIn: 'root' })
export class MileageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mileage`;

  getMyLogs(): Observable<MileageLogResponse[]> {
    return this.http.get<ApiResponse<MileageLogResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getAll(): Observable<MileageLogResponse[]> {
    return this.getMyLogs();
  }

  getByVehicle(vehicleId: number): Observable<MileageLogResponse[]> {
    return this.http.get<ApiResponse<MileageLogResponse[]>>(
      `${this.baseUrl}/vehicle/${vehicleId}`
    ).pipe(map(res => res.data));
  }

  create(request: MileageLogRequest): Observable<MileageLogResponse> {
    return this.http.post<ApiResponse<MileageLogResponse>>(this.baseUrl, request).pipe(
      map(res => res.data)
    );
  }
}
