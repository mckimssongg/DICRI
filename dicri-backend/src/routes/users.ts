import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { getPool } from '../db/pool';

const router = Router();

const CreateUserSchema = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, 'Password débil'),
  mfa_required: z.boolean().optional().default(false),
  roles: z.array(z.string()).default([])
});

router.post('/', authGuard(), rbacGuard(['users.write']), async (req,res) => {
  const p = CreateUserSchema.parse(req.body);
  const hash = await bcrypt.hash(p.password, 10);
  const pool = getPool();

  const r = await pool.request()
    .input('username', sql.NVarChar(64), p.username)
    .input('email', sql.NVarChar(256), p.email)
    .input('password_hash', sql.NVarChar(200), hash)
    .input('mfa_required', sql.Bit, p.mfa_required ? 1 : 0)
    .input('is_active', sql.Bit, 1)
    .execute('core.usp_User_Create');
  const uid = r.recordset?.[0]?.user_id as number;

  for (const rk of p.roles) {
    await pool.request()
      .input('user_id', sql.BigInt, uid)
      .input('role_key', sql.NVarChar(50), rk)
      .execute('core.usp_User_AssignRole');
  }

  res.status(201).json({ id: uid, username: p.username, email: p.email, roles: p.roles });
});

export default router;
