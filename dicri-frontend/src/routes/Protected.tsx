import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../store/auth';

export function Protected({ children }: { children: ReactNode }) {
  const token = useAuth(s=>s.accessToken);
  const user = useAuth(s=>s.user);
  const loadPermissions = useAuth(s=>s.loadPermissions);
  const location = useLocation();

  useEffect(() => {
    if (token) loadPermissions().catch(()=>{});
  }, [token]);

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
