import axios from 'axios';
import { useAuth } from '../store/auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1',
  withCredentials: true,
});

// Request: agrega Authorization salvo que se indique skipAuth
api.interceptors.request.use((config: any) => {
  if ((config as any).skipAuth) return config;
  const token = useAuth.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: si 401 intenta refresh una vez
let isRefreshing = false;
let pending: Array<() => void> = [];

function onRefreshed() {
  pending.forEach((cb) => cb());
  pending = [];
}

api.interceptors.response.use(
  (r: any) => r,
  async (error: any) => {
    const original: any = error.config || {};
    const status = error?.response?.status;
    if (status === 401 && !original._retry && !original.skipAuth) {
      original._retry = true;
      const auth = useAuth.getState();

      if (!isRefreshing) {
        isRefreshing = true;
        const ok = await auth.refresh();
        isRefreshing = false;
        onRefreshed();
        if (ok) {
          // reintentar
          return api(original);
        } else {
          await auth.logout();
          return Promise.reject(error);
        }
      }

      return new Promise((resolve) => {
        pending.push(() => resolve(api(original)));
      });
    }
    return Promise.reject(error);
  }
);
