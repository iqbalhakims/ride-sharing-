export type UserRole = 'rider' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
