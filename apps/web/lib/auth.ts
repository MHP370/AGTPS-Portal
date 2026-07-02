import { api } from "./api";

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;

  firstName: string | null;
  lastName: string | null;

  isActive: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export async function login(
  dto: LoginDto,
): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    "/auth/login",
    dto,
  );
}
