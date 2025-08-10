import sql from 'mssql';
import { getPool } from '../db/pool';

export async function userList(params:{ q?:string; page?:number; pageSize?:number }) {
  const r = await getPool().request()
    .input('q', sql.NVarChar(128), params.q ?? null)
    .input('page', sql.Int, params.page ?? 1)
    .input('pageSize', sql.Int, params.pageSize ?? 20)
    .execute('core.usp_User_List');

  const items = Array.isArray(r.recordsets) ? r.recordsets[0] ?? [] : [];
  const total = Array.isArray(r.recordsets) && r.recordsets[1]?.[0]?.total ? r.recordsets[1][0].total : 0;
  return { items, total };
}

export async function userGetById(id:number) {
  const r = await getPool().request()
    .input('user_id', sql.BigInt, id)
    .execute('core.usp_User_GetById');
  const user = r.recordset?.[0] ?? null;
  const recordsets = r.recordsets as sql.IRecordSet<any>[];
  const roles = (Array.isArray(recordsets[1]) ? recordsets[1].map((x:any)=>x.role_key as string) : []);
  return user ? { ...user, roles } : null;
}

export async function userUpdate(id:number, data:{ email:string; is_active:boolean; mfa_required:boolean }) {
  const r = await getPool().request()
    .input('user_id', sql.BigInt, id)
    .input('email', sql.NVarChar(256), data.email)
    .input('is_active', sql.Bit, data.is_active ? 1 : 0)
    .input('mfa_required', sql.Bit, data.mfa_required ? 1 : 0)
    .execute('core.usp_User_Update');
  return r.recordset?.[0]?.affected === 1;
}

export async function userSetPassword(id:number, password_hash:string) {
  const r = await getPool().request()
    .input('user_id', sql.BigInt, id)
    .input('password_hash', sql.NVarChar(200), password_hash)
    .execute('core.usp_User_SetPassword');
  return r.recordset?.[0]?.affected === 1;
}

export async function userDisable(id:number, actor?:string) {
  const r = await getPool().request()
    .input('user_id', sql.BigInt, id)
    .input('actor', sql.NVarChar(128), actor ?? null)
    .execute('core.usp_User_Disable');
  return r.recordset?.[0]?.affected === 1;
}
