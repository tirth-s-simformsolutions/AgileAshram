export type UserRole = 'citizen' | 'admin_infrastructure' | 'admin_sanitation';

export interface User {
  id?: string;
  name: string;
  digilockerId?: string;
  phone?: string;
  email?: string;
  role: UserRole;
  token?: string;
}
