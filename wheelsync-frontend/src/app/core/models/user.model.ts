import { Role } from './auth.model';

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  companyId: number | null;
  companyName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  companyId?: number | null;
  isActive: boolean;
}
