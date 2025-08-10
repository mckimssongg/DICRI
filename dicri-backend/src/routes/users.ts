// src/routes/users.ts
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { userList, userGetById, userUpdate, userSetPassword, userDisable } from '../services/users';
import { getPool } from '../db/pool';
import sql from 'mssql';

const router = Router();

/* ====== CREATE ====== */
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

/* ====== LIST ====== */
const ListQuery = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
router.get('/', authGuard(), rbacGuard(['users.read']), async (req,res) => {
  const q = ListQuery.parse(req.query);
  res.json(await userList(q));
});

/* ====== GET BY ID ====== */
router.get('/:id', authGuard(), rbacGuard(['users.read']), async (req,res) => {
  const id = Number(req.params.id);
  const u = await userGetById(id);
  if (!u) return res.status(404).json({ error: 'No encontrado' });
  res.json(u);
});

/* ====== UPDATE ====== */
const UpdateSchema = z.object({
  email: z.string().email(),
  is_active: z.boolean(),
  mfa_required: z.boolean()
});
router.put('/:id', authGuard(), rbacGuard(['users.write']), async (req,res) => {
  const id = Number(req.params.id);
  const p = UpdateSchema.parse(req.body);
  const ok = await userUpdate(id, p);
  return res.status(ok ? 200 : 404).json(ok ? { ok: true } : { error: 'No encontrado' });
});

/* ====== SET PASSWORD ====== */
const PasswordSchema = z.object({
  password: z.string().min(8).max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, 'Password débil')
});
router.put('/:id/password', authGuard(), rbacGuard(['users.write']), async (req,res) => {
  const id = Number(req.params.id);
  const { password } = PasswordSchema.parse(req.body);
  const hash = await bcrypt.hash(password, 10);
  const ok = await userSetPassword(id, hash);
  return res.status(ok ? 200 : 404).json(ok ? { ok: true } : { error: 'No encontrado' });
});

/* ====== DISABLE (soft) ====== */
router.delete('/:id', authGuard(), rbacGuard(['users.write']), async (req,res) => {
  const id = Number(req.params.id);
  const ok = await userDisable(id, req.auth!.username);
  return res.status(ok ? 204 : 404).send();
});

export default router;
