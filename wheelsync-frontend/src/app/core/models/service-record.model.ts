export type ServiceType = 'OIL_CHANGE' | 'FILTER_CHANGE' | 'TIRE_CHANGE' | 'ENGINE_REPAIR' | 'TECHNICAL_INSPECTION' | 'OTHER';
export type ServiceRecordStatus = 'PENDING' | 'CONFIRMED';

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  OIL_CHANGE: 'Oil Change',
  FILTER_CHANGE: 'Filter Change',
  TIRE_CHANGE: 'Tire Change',
  ENGINE_REPAIR: 'Engine Repair',
  TECHNICAL_INSPECTION: 'Technical Inspection',
  OTHER: 'Other'
};

export const SERVICE_RECORD_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed'
};

export interface ServiceDocumentResponse {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface ServiceRecordResponse {
  id: number;
  vehicleId: number;
  vehicleName: string;
  serviceType: ServiceType;
  date: string;
  mileage: number;
  location: string | null;
  cost: number;
  description: string | null;
  status: ServiceRecordStatus;
  createdByName: string | null;
  documents: ServiceDocumentResponse[];
  createdAt: string;
}

export interface ServiceRecordRequest {
  vehicleId: number;
  serviceType: ServiceType;
  date: string;
  mileage: number;
  location?: string;
  cost: number;
  description?: string;
  status?: ServiceRecordStatus;
}
