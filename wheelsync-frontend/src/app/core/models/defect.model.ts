export type DefectPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type DefectStatus = 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED';

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

export const DEFECT_STATUS_LABELS: Record<string, string> = {
  REPORTED: 'Reported',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved'
};

export interface DefectResponse {
  id: number;
  vehicleId: number;
  vehicleName: string;
  reportedByName: string;
  title: string;
  description: string | null;
  priority: DefectPriority;
  status: DefectStatus;
  resolutionNote: string | null;
  resolvedDate: string | null;
  serviceRecordId: number | null;
  hasPhoto: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DefectRequest {
  vehicleId: number;
  title: string;
  description?: string;
  priority: DefectPriority;
}

export interface DefectStatusUpdateRequest {
  status: DefectStatus;
  resolutionNote?: string;
  resolvedDate?: string;
  serviceRecordId?: number;
}
