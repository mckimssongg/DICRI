import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool';

export type UserRow = {
  user_id: number;
  username: string;
  email: string | null;
  password_hash: string;
  is_active: boolean;
  mfa_required: boolean;
  failed_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
};
export async function getUserWithRoles(username: string) {
  const pool = getPool();
  const result = await pool.request()
    .input('username', sql.NVarChar(64), username)
    .execute('core.usp_User_GetByUsername');

  const recordsets = result.recordsets as sql.IRecordSet<any>[];
  const user = recordsets[0]?.[0] as UserRow | undefined;
  const roles = (recordsets[1] || []).map((r: any) => r.role_key as string);
  return { user, roles };
}

export async function registerFailed(username: string) {
  const pool = getPool();
  const r = await pool.request()
    .input('username', sql.NVarChar(64), username)
    .execute('core.usp_User_RegisterFailedLogin');
  return r.recordset?.[0];
}

export async function registerSuccess(username: string) {
  const pool = getPool();
  await pool.request()
    .input('username', sql.NVarChar(64), username)
    .execute('core.usp_User_RegisterSuccessLogin');
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
