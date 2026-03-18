import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  MaintenanceReminderResponse,
  MaintenanceReminderRequest
} from '../models/reminder.model';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reminders`;

  getAll(): Observable<MaintenanceReminderResponse[]> {
    return this.http.get<ApiResponse<MaintenanceReminderResponse[]>>(this.baseUrl).pipe(
      map(res => res.data)
    );
  }

  getByVehicle(vehicleId: number): Observable<MaintenanceReminderResponse[]> {
    return this.http.get<ApiResponse<MaintenanceReminderResponse[]>>(
      `${this.baseUrl}/vehicle/${vehicleId}`
    ).pipe(map(res => res.data));
  }

  create(req: MaintenanceReminderRequest): Observable<MaintenanceReminderResponse> {
    return this.http.post<ApiResponse<MaintenanceReminderResponse>>(this.baseUrl, req).pipe(
      map(res => res.data)
    );
  }

  update(id: number, req: MaintenanceReminderRequest): Observable<MaintenanceReminderResponse> {
    return this.http.put<ApiResponse<MaintenanceReminderResponse>>(`${this.baseUrl}/${id}`, req).pipe(
      map(res => res.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }
}
