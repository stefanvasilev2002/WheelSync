export interface CompanyResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
  createdAt: string;
  userCount: number;
  vehicleCount: number;
  managerId?: number;
  managerName?: string;
}

export interface CompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  managerId?: number;
}
