import { ReactNode } from 'react';
import { useAuth } from '../store/auth';

export function Can({ anyOf, children }: { anyOf: string[]; children: ReactNode }) {
  const hasPerm = useAuth(s=>s.hasPerm);
  const ok = anyOf.some(p => hasPerm(p));
  if (!ok) return null;
  return <>{children}</>;
}
