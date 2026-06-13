export type UserRole = 'citizen' | 'department' | 'admin' | 'admin_infrastructure' | 'admin_sanitation';

export interface User {
  _id: string;
  role: UserRole;
  status?: string;
  // Citizen fields
  digilockerId?: string;
  phone?: string;
  // Admin fields
  name?: string;
  email?: string;
}
