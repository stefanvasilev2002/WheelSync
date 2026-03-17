export interface CompanyResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
  createdAt: string;
  userCount: number;
  vehicleCount: number;
}

export interface CompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
}
