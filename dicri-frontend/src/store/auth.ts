import { create } from 'zustand';
import { api } from '../utils/http';

type User = { id:number; username:string; email?:string; roles:string[]; mfaRequired?:boolean };

type AuthState = {
  accessToken?: string;
  user?: User;
  permissions: string[];
  loading: boolean;
  error?: string;
  setAuth: (t?: string, u?: User) => void;
  login: (username:string, password:string) => Promise<{ ok:true } | { ok:false; status:number; data:any }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  loadPermissions: () => Promise<void>;
  hasPerm: (perm:string) => boolean;
};

const storageKey = 'dicri.auth';

function saveToStorage(auth: { accessToken?:string; user?:User }) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(auth));
  } catch {}
}

function loadFromStorage(): { accessToken?:string; user?:User } | undefined {
  try {
    const v = localStorage.getItem(storageKey);
    return v ? JSON.parse(v) : undefined;
  } catch { return undefined; }
}

export const useAuth = create<AuthState>((set, get) => ({
  ...loadFromStorage(),
  permissions: [],
  loading: false,
  error: undefined,
  setAuth: (t, u) => {
    saveToStorage({ accessToken: t, user: u });
    set({ accessToken: t, user: u });
  },
  login: async (username, password) => {
    set({ loading: true, error: undefined });
    try {
      const r = await api.post('/auth/login', { username, password }, { withCredentials: true });
      const { accessToken, user } = r.data;
      saveToStorage({ accessToken, user });
      set({ accessToken, user, loading: false });
      await get().loadPermissions();
      return { ok: true } as const;
    } catch (e:any) {
      const status = e?.response?.status ?? 0;
      const data = e?.response?.data ?? null;
      set({ loading: false, error: data?.error || 'Error de autenticación' });
      return { ok: false, status, data } as const;
    }
  },
  logout: async () => {
    try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch {}
    saveToStorage({});
    set({ accessToken: undefined, user: undefined, permissions: [] });
  },
  refresh: async () => {
    try {
      const r = await api.post('/auth/refresh', {}, { withCredentials: true });
      const accessToken = r.data?.accessToken as string | undefined;
      if (accessToken) {
        set({ accessToken });
        saveToStorage({ accessToken, user: get().user });
        return true;
      }
      return false;
    } catch { return false; }
  },
  loadPermissions: async () => {
    try {
      const res = await api.get('/rbac/me/permissions');
      const perms: string[] = res.data?.permissions ?? [];
      set({ permissions: perms });
    } catch {
      set({ permissions: [] });
    }
  },
  hasPerm: (perm) => get().permissions.includes(perm),
}));
