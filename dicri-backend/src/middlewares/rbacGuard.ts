import { Request, Response, NextFunction } from 'express';
import { userPermissions } from '../services/rbac';

export function rbacGuard(required: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'No auth' });
    const perms = await userPermissions(req.auth.sub);
    const ok = required.some(p => perms.includes(p));
    if (!ok) return res.status(403).json({ error: 'Forbidden: missing permission', required });
    return next();
  };
}
