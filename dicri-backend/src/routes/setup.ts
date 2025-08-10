import { Router } from 'express';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { getPool } from '../db/pool';

const router = Router();

/**
 * Crea admin (idempotente) con pass Admin123!
 * DESHABILITAR en producción.
 */
router.post('/setup/seed-admin', async (_req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).send();
  const pool = getPool();
  const username = 'admin';
  const email = 'admin@dicri.test';
  const hash = await bcrypt.hash('Admin123!', 10);

  // crea usuario si no existe
  const r = await pool.request()
    .input('username', sql.NVarChar(64), username)
    .input('email', sql.NVarChar(256), email)
    .input('password_hash', sql.NVarChar(200), hash)
    .input('mfa_required', sql.Bit, 0)
    .input('is_active', sql.Bit, 1)
    .execute('core.usp_User_Create');
  const userId = r.recordset?.[0]?.user_id;

  // asigna rol admin
  await pool.request()
    .input('user_id', sql.BigInt, userId)
    .input('role_key', sql.NVarChar(50), 'admin')
    .execute('core.usp_User_AssignRole');

  res.json({ ok: true, userId });
});

export default router;
