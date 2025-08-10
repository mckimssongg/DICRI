import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

type Expires = SignOptions['expiresIn'];

function parseExpires(v: string | undefined, fallback: Expires): Expires {
  if (!v) return fallback;
  // Si te pasan "900" lo interpretamos como número (segundos).
  if (/^\d+$/.test(v)) return Number(v);
  // Si te pasan "15m", "7d", etc., lo casteamos al tipo correcto.
  return v as Expires;
}

const accessSecret: Secret = (process.env.JWT_ACCESS_SECRET ?? '') as Secret;
const refreshSecret: Secret = (process.env.JWT_REFRESH_SECRET ?? '') as Secret;

const accessExp: Expires = parseExpires(process.env.JWT_ACCESS_EXPIRES, '15m');
const refreshExp: Expires = parseExpires(process.env.JWT_REFRESH_EXPIRES, '7d');

export function signAccess(payload: object) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExp });
}

export function signRefresh(payload: object) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExp });
}

export function verifyAccess<T=any>(token: string): T {
  return jwt.verify(token, accessSecret) as T;
}
export function verifyRefresh<T=any>(token: string): T {
  return jwt.verify(token, refreshSecret) as T;
}