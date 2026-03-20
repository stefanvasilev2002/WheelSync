export interface VehicleStatRow {
  vehicleId: number;
  vehicleName: string;
  distanceKm: number;
  fuelCost: number;
  avgConsumption: number | null;
}

export interface MonthlyCostRow {
  month: string; // YYYY-MM
  fuelCost: number;
  serviceCost: number;
  totalCost: number;
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
  monthlyCosts: MonthlyCostRow[];
  costByServiceType: Record<string, number>;
}
