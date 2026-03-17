export interface MileageLogResponse {
  id: number;
  vehicleId: number;
  vehicleDisplayName: string;
  driverId: number;
  driverName: string;
  date: string;
  startMileage: number;
  endMileage: number;
  distance: number;
  note: string | null;
  createdAt: string;
}

export interface MileageLogRequest {
  vehicleId: number;
  date: string;
  startMileage: number;
  endMileage: number;
  note?: string;
}
