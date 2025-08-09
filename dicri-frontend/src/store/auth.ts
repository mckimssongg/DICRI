import { create } from 'zustand';

type AuthState = {
  accessToken?: string;
  user?: { id:number; username:string; roles:string[] };
  permissions: string[];
  setAuth: (t?: string, u?: any) => void;
  loadPermissions: () => Promise<void>;
  hasPerm: (perm:string) => boolean;
};

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: undefined,
  user: undefined,
  permissions: [],
  setAuth: (t, u) => set({ accessToken: t, user: u }),
  loadPermissions: async () => {
    const res = await fetch('/api/v1/rbac/me/permissions', { credentials:'include', headers: { Authorization: `Bearer ${get().accessToken}` }});
    const data = await res.json();
    set({ permissions: data.permissions ?? [] });
  },
  hasPerm: (perm) => get().permissions.includes(perm),
}));
