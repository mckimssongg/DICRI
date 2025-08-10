import sql from 'mssql';
import { getPool } from '../db/pool';

export async function expedienteSubmit(expedienteId: number, actorId: number) {
  await getPool().request()
    .input('expediente_id', sql.BigInt, expedienteId)
    .input('actor_id', sql.BigInt, actorId)
    .execute('core.usp_Expediente_Submit');
  return { status: 'ok' };
}

export async function expedienteApprove(expedienteId: number, actorId: number) {
  await getPool().request()
    .input('expediente_id', sql.BigInt, expedienteId)
    .input('actor_id', sql.BigInt, actorId)
    .execute('core.usp_Expediente_Approve');
  return { status: 'ok' };
}

export async function expedienteReject(expedienteId: number, actorId: number, motivo: string) {
  await getPool().request()
    .input('expediente_id', sql.BigInt, expedienteId)
    .input('actor_id', sql.BigInt, actorId)
    .input('motivo', sql.NVarChar(1000), motivo)
    .execute('core.usp_Expediente_Reject');
  return { status: 'ok' };
}

export async function expedienteResubmit(expedienteId: number, actorId: number) {
  await getPool().request()
    .input('expediente_id', sql.BigInt, expedienteId)
    .input('actor_id', sql.BigInt, actorId)
    .execute('core.usp_Expediente_Resubmit');
  return { status: 'ok' };
}
