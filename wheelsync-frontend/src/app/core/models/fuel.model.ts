import { FuelType } from './vehicle.model';

export interface FuelLogResponse {
  id: number;
  vehicleId: number;
  vehicleDisplayName: string;
  driverId: number;
  driverName: string;
  date: string;
  fuelType: FuelType;
  quantityLiters: number;
  pricePerLiter: number;
  totalPrice: number;
  mileageAtRefuel: number;
  consumption: number | null;
  location: string;
  createdAt: string;
}

export interface FuelLogRequest {
  vehicleId: number;
  date: string;
  fuelType: FuelType;
  quantityLiters: number;
  pricePerLiter: number;
  mileageAtRefuel: number;
  location?: string;
}
