import { api, unwrap } from '@/lib/api';
import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  login: (payload: LoginPayload) =>
    unwrap<AuthResponse>(api.post('/auth/login', payload)),
  register: (payload: RegisterPayload) =>
    unwrap<{ user: User }>(api.post('/auth/register', payload)),
  refresh: (refreshToken: string) =>
    unwrap<AuthResponse>(api.post('/auth/refresh', { refreshToken })),
  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email: string) =>
    unwrap<{ sent: boolean; devOtp?: string }>(api.post('/auth/forgot-password', { email })),
  verifyOtp: (email: string, otp: string) =>
    unwrap<{ valid: boolean }>(api.post('/auth/verify-otp', { email, otp })),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    unwrap<{ success: boolean }>(api.post('/auth/reset-password', { email, otp, newPassword })),
  me: () => unwrap<{ user: User }>(api.get('/auth/me')),
};
