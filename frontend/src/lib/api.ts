import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null): void => {
  queue.forEach((cb) => cb(token));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as RetryConfig | undefined;
    if (!original || !err.response) throw err;

    if (err.response.status === 401 && !original._retry) {
      if (original.url?.includes('/auth/')) throw err;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(err);
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw err;
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        useAuthStore.getState().setTokens(newAccess, newRefresh);
        processQueue(newAccess);
        if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    throw err;
  },
);

export const unwrap = <T>(p: Promise<{ data: { data: T } }>): Promise<T> =>
  p.then((r) => r.data.data);
