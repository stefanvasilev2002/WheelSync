export interface ReportServiceRow {
  date: string;
  serviceType: string;
  mileage: number;
  cost: number;
  location: string | null;
  description: string | null;
}

export interface ReportFuelRow {
  date: string;
  fuelType: string;
  quantityLiters: number;
  pricePerLiter: number;
  totalPrice: number;
  mileageAtRefuel: number;
  consumption: number | null;
  location: string | null;
}

export interface ReportMileageRow {
  date: string;
  startMileage: number;
  endMileage: number;
  distance: number;
  note: string | null;
  driverName: string;
}

export interface ReportDefectRow {
  reportedAt: string;
  title: string;
  priority: string;
  status: string;
  resolutionNote: string | null;
}

export interface VehicleReportResponse {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  color: string | null;
  engineType: string | null;
  fuelType: string;
  currentMileage: number;
  assignedDriverName: string | null;
  totalServiceCost: number;
  totalFuelCost: number;
  totalCost: number;
  totalDistanceKm: number;
  services: ReportServiceRow[];
  fuelLogs: ReportFuelRow[];
  mileageLogs: ReportMileageRow[];
  defects: ReportDefectRow[];
}
