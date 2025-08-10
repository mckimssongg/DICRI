import sql from 'mssql';
import { getPool } from '../db/pool';

export async function listRoles() {
  const r = await getPool().request().execute('core.usp_Role_List');
  return r.recordset as { role_id:number; role_key:string; role_name:string }[];
}
export async function listPermissions() {
  const r = await getPool().request().execute('core.usp_Permission_List');
  return r.recordset as { perm_id:number; perm_key:string; perm_name:string }[];
}
export async function grant(roleKey: string, permKey: string, actor?: string) {
  await getPool().request()
    .input('role_key', sql.NVarChar(50), roleKey)
    .input('perm_key', sql.NVarChar(100), permKey)
    .input('actor',    sql.NVarChar(128), actor ?? null)
    .execute('core.usp_Role_GrantPermission');
}
export async function revoke(roleKey: string, permKey: string, actor?: string) {
  await getPool().request()
    .input('role_key', sql.NVarChar(50), roleKey)
    .input('perm_key', sql.NVarChar(100), permKey)
    .input('actor',    sql.NVarChar(128), actor ?? null)
    .execute('core.usp_Role_RevokePermission');
}
export async function userPermissions(userId: number) {
  const r = await getPool().request()
    .input('user_id', sql.BigInt, userId)
    .execute('core.usp_User_GetPermissions');
  return r.recordset.map((x:any)=>x.perm_key as string);
}
