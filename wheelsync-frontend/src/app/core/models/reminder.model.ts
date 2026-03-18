export interface MaintenanceReminderResponse {
  id: number;
  vehicleId: number;
  vehicleName: string;
  serviceType: string;
  intervalType: 'MILEAGE' | 'DATE';
  mileageInterval: number | null;
  dateIntervalMonths: number | null;
  lastServiceDate: string | null;
  lastServiceMileage: number | null;
  nextDueDate: string | null;
  nextDueMileage: number | null;
  warningThresholdKm: number;
  warningThresholdDays: number;
  isActive: boolean;
  isDueSoon: boolean;
  createdAt: string;
}

export interface MaintenanceReminderRequest {
  vehicleId: number;
  serviceType: string;
  intervalType: 'MILEAGE' | 'DATE';
  mileageInterval?: number;
  dateIntervalMonths?: number;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  warningThresholdKm?: number;
  warningThresholdDays?: number;
}
