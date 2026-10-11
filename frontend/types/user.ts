export type UserRole = "umkm" | "mitra" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  emailVerified: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
