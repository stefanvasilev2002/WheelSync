export type FuelType = 'PETROL' | 'DIESEL' | 'LPG' | 'ELECTRIC' | 'HYBRID';

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  PETROL: 'Бензин',
  DIESEL: 'Дизел',
  LPG: 'Автогас',
  ELECTRIC: 'Електричен',
  HYBRID: 'Хибрид'
};

export interface VehicleResponse {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  color: string;
  engineType: string;
  fuelType: FuelType;
  currentMileage: number;
  isActive: boolean;
  companyId: number;
  companyName: string;
  assignedDriverId: number | null;
  assignedDriverName: string | null;
}

export interface VehicleRequest {
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  color?: string;
  engineType?: string;
  fuelType: FuelType;
  currentMileage: number;
}

export interface VehicleAssignmentResponse {
  id: number;
  vehicleId: number;
  vehicleDisplayName: string;
  driverId: number;
  driverName: string;
  driverEmail: string;
  assignedDate: string;
  unassignedDate: string | null;
  isActive: boolean;
}

export interface AssignVehicleRequest {
  driverId: number;
  assignedDate: string; // yyyy-MM-dd
}
