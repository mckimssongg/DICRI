import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt';

export interface AuthUser {
  sub: number;
  username: string;
  roles: string[];
}
declare module 'express-serve-static-core' {
  interface Request { auth?: AuthUser }
}

export function authGuard(required?: { roles?: string[] }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'No token' });

    try {
      const payload = verifyAccess<AuthUser>(token);
      if (required?.roles?.length) {
        const ok = required.roles.some(r => payload.roles?.includes(r));
        if (!ok) return res.status(403).json({ error: 'Forbidden' });
      }
      req.auth = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}
