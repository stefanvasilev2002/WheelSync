import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { StatsResponse } from '../models/stats.model';

export interface StatsFilter {
  dateFrom?: string;   // ISO date YYYY-MM-DD
  dateTo?: string;
  vehicleId?: number;
  driverId?: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stats`;

  getStats(filter?: StatsFilter): Observable<StatsResponse> {
    let params = new HttpParams();
    if (filter?.dateFrom)  params = params.set('dateFrom',  filter.dateFrom);
    if (filter?.dateTo)    params = params.set('dateTo',    filter.dateTo);
    if (filter?.vehicleId) params = params.set('vehicleId', filter.vehicleId.toString());
    if (filter?.driverId)  params = params.set('driverId',  filter.driverId.toString());

    return this.http.get<ApiResponse<StatsResponse>>(this.baseUrl, { params }).pipe(
      map(res => res.data)
    );
  }
}
