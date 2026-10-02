export type UserRole = "umkm" | "mitra";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  emailVerified: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
