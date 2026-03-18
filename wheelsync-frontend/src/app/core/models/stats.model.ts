export interface VehicleStatRow {
  vehicleId: number;
  vehicleName: string;
  distanceKm: number;
  fuelCost: number;
}

export interface StatsResponse {
  totalVehicles: number;
  assignedVehicles: number;
  unassignedVehicles: number;
  totalMileageLogs: number;
  totalDistanceKm: number;
  totalFuelLogs: number;
  totalFuelCost: number;
  totalServiceRecords: number;
  totalServiceCost: number;
  openDefects: number;
  resolvedDefects: number;
  dueSoonReminders: number;
  topVehiclesByDistance: VehicleStatRow[];
}
