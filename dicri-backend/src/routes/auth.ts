import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getUserWithRoles, registerFailed, registerSuccess, verifyPassword } from '../services/auth';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt';
import { authGuard } from '../middlewares/authGuard';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool';
import { sendMail } from '../services/mailer';

export const authRouter = Router();

// rate limit específico para login
const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 });
authRouter.use('/login', loginLimiter);

const LoginSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(200)
});

authRouter.post('/login', async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Datos inválidos' });

  const { username, password } = parse.data;

  // Buscar usuario + roles
  const { user, roles } = await getUserWithRoles(username);
  // Mensaje genérico para no filtrar existencia
  const invalidMsg = 'Usuario o contraseña incorrectos';

  if (!user || !user.is_active) {
    // seguridad: no revelamos si no existe
    await registerFailed(username).catch(() => {});
    return res.status(401).json({ error: invalidMsg });
  }

  // ¿está bloqueado?
  const now = new Date();
  if (user.locked_until && user.locked_until > now) {
    return res.status(423).json({
      error: 'Cuenta bloqueada temporalmente. Intenta más tarde.',
      lockedUntil: user.locked_until
    });
  }

  // verificar contraseña
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    const f = await registerFailed(username);
    const attempts = f?.failed_attempts ?? user.failed_attempts + 1;
    const remaining = Math.max(0, 3 - attempts);
    return res.status(401).json({
      error: invalidMsg,
      remainingAttempts: remaining,
      lockedUntil: f?.locked_until || null
    });
  }

  // éxito
  await registerSuccess(username);

  // emitir tokens
  const basePayload = { sub: user.user_id, username: user.username, roles };
  const accessToken = signAccess(basePayload);
  const refreshToken = signRefresh({ ...basePayload, type: 'refresh' });

  // cookie httpOnly para refresh (dev: sin secure)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/api/v1/auth'
  });

  return res.json({
    accessToken,
    user: {
      id: user.user_id,
      username: user.username,
      email: user.email,
      roles,
      mfaRequired: user.mfa_required
    }
  });
});

const refreshLimiter = rateLimit({ windowMs: 60_000, max: 30 });
authRouter.use('/refresh', refreshLimiter);

authRouter.post('/refresh', async (req, res) => {
  const rt = req.cookies?.['refresh_token'];
  if (!rt) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = verifyRefresh<{ sub: number; username: string; roles: string[]; type?: string }>(rt);
    if (payload.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });

    // opcional: aquí podríamos validar sesión en DB/Redis
    const base = { sub: payload.sub, username: payload.username, roles: payload.roles };
    const newAccess = signAccess(base);
    const newRefresh = signRefresh({ ...base, type: 'refresh' }); // rotación simple

    res.cookie('refresh_token', newRefresh, {
      httpOnly: true, sameSite: 'lax', secure: false, path: '/api/v1/auth'
    });

    return res.json({ accessToken: newAccess });
  } catch {
    return res.status(401).json({ error: 'Refresh inválido o expirado' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('refresh_token', { path: '/api/v1/auth' });
  return res.status(204).send();
});

authRouter.get('/me', authGuard(), (req, res) => {
  return res.json({ user: req.auth });
});

const ResetRequestSchema = z.object({
  username: z.string().min(3).max(64).optional(),
  email: z.string().email().optional()
}).refine(d => d.username || d.email, { message: 'username o email requerido' });

authRouter.post('/reset/request', async (req, res) => {
  const p = ResetRequestSchema.parse(req.body);
  const r = await getPool().request()
    .input('username', sql.NVarChar(64), p.username ?? null)
    .input('email', sql.NVarChar(256), p.email ?? null)
    .execute('core.usp_PasswordReset_Request');

  // Mail con token (dev). Si no hubo usuario, r.recordset puede venir vacío.
  const token = r.recordset?.[0]?.token as string | undefined;
  if (token && p.email) {
    const link = `http://localhost:5173/reset?token=${encodeURIComponent(token)}`;
    await sendMail(p.email, 'Reset de contraseña', `<p>Usa este enlace para restablecer tu contraseña:</p><p><a href="${link}">${link}</a></p>`);
  }

  return res.status(202).json({ status: 'accepted' });
});

const ResetConfirmSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, 'Password débil')
});

authRouter.post('/reset/confirm', async (req, res) => {
  const p = ResetConfirmSchema.parse(req.body);
  const hash = await bcrypt.hash(p.newPassword, 10);

  try {
    const r = await getPool().request()
      .input('token', sql.NVarChar(128), p.token)
      .input('new_hash', sql.NVarChar(200), hash)
      .execute('core.usp_PasswordReset_Consume');
    return res.json({ status: 'ok' });
  } catch (e) {
    const msg = (e as any)?.message || '';
    if (msg.includes('inválido o expirado')) return res.status(410).json({ error: 'Token inválido o expirado' });
    return res.status(400).json({ error: 'No se pudo restablecer' });
  }
});

export default authRouter;
