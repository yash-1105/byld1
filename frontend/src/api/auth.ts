import client from './client';

// ---- Types ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'architect' | 'contractor' | 'client' | 'consultant';
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'architect' | 'contractor' | 'client' | 'consultant';
  avatar_key: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}

// ---- Endpoints ----

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const register = (data: RegisterRequest) =>
  client.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const refreshToken = (token: string) =>
  client.post<AuthResponse>('/auth/refresh', { refresh_token: token }).then((r) => r.data);

export const getMe = () =>
  client.get<UserResponse>('/auth/me').then((r) => r.data);

export const logout = () =>
  client.post<null>('/auth/logout').then((r) => r.data);
