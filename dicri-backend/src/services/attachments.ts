import sql from 'mssql';
import { getPool } from '../db/pool';

export async function adjuntoCreate(params: {
  expediente_id: number;
  archivo_nombre: string;
  mime: string;
  tamano_bytes: number;
  sha256: string;
  storage_key: string;
  creado_por: number;
}) {
  const r = await getPool().request()
    .input('expediente_id', sql.BigInt, params.expediente_id)
    .input('archivo_nombre', sql.NVarChar(255), params.archivo_nombre)
    .input('mime', sql.NVarChar(100), params.mime)
    .input('tamano_bytes', sql.BigInt, params.tamano_bytes)
    .input('sha256', sql.NVarChar(64), params.sha256)
    .input('storage_key', sql.NVarChar(300), params.storage_key)
    .input('creado_por', sql.BigInt, params.creado_por)
    .execute('core.usp_Adjunto_Create');
  return r.recordset?.[0] as { adjunto_id: number };
}

export async function adjuntoUpdateScan(adjuntoId: number, status: 'CLEAN'|'INFECTED'|'ERROR', details?: string) {
  const r = await getPool().request()
    .input('adjunto_id', sql.BigInt, adjuntoId)
    .input('status', sql.NVarChar(20), status)
    .input('details', sql.NVarChar(400), details ?? null)
    .execute('core.usp_Adjunto_UpdateScan');
  return r.recordset?.[0]?.affected === 1;
}

export async function adjuntosListByExpediente(expedienteId: number) {
  const r = await getPool().request()
    .input('expediente_id', sql.BigInt, expedienteId)
    .execute('core.usp_Adjunto_ListByExpediente');
  return r.recordset;
}

export async function adjuntoGetById(adjuntoId: number) {
  const r = await getPool().request()
    .input('adjunto_id', sql.BigInt, adjuntoId)
    .execute('core.usp_Adjunto_GetById');
  return r.recordset?.[0] ?? null;
}

export async function adjuntoDelete(adjuntoId: number, actor?: string) {
  const r = await getPool().request()
    .input('adjunto_id', sql.BigInt, adjuntoId)
    .input('actor', sql.NVarChar(128), actor ?? null)
    .execute('core.usp_Adjunto_Delete');
  return r.recordset?.[0]?.affected === 1;
}
