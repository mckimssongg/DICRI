import sql from 'mssql';
import { getPool } from '../db/pool';

export type IndicioInput = {
  expediente_id: number;
  tipo_code: string;
  descripcion?: string | null;
  color_code?: string | null;
  tamano?: string | null;
  peso?: string | null;
  ubicacion_code?: string | null;
  tecnico_id: number;
};

export async function indicioCreate(input: IndicioInput) {
  const r = await getPool().request()
    .input('expediente_id',  sql.BigInt,        input.expediente_id)
    .input('tipo_code',      sql.NVarChar(80),  input.tipo_code)
    .input('descripcion',    sql.NVarChar(2000),input.descripcion ?? null)
    .input('color_code',     sql.NVarChar(80),  input.color_code ?? null)
    .input('tamano',         sql.NVarChar(120), input.tamano ?? null)
    .input('peso',           sql.NVarChar(120), input.peso ?? null)
    .input('ubicacion_code', sql.NVarChar(80),  input.ubicacion_code ?? null)
    .input('tecnico_id',     sql.BigInt,        input.tecnico_id)
    .execute('core.usp_Indicio_Create');
  return r.recordset?.[0] as { indicio_id: number };
}

export async function indiciosListByExpediente(expedienteId: number) {
  const r = await getPool().request()
    .input('expediente_id', sql.BigInt, expedienteId)
    .execute('core.usp_Indicio_ListByExpediente');
  return r.recordset;
}

export async function indicioUpdate(id: number, data: {
  tipo_code: string; descripcion?: string|null; color_code?: string|null;
  tamano?: string|null; peso?: string|null; ubicacion_code?: string|null;
}) {
  const r = await getPool().request()
    .input('indicio_id',     sql.BigInt, id)
    .input('tipo_code',      sql.NVarChar(80),  data.tipo_code)
    .input('descripcion',    sql.NVarChar(2000),data.descripcion ?? null)
    .input('color_code',     sql.NVarChar(80),  data.color_code ?? null)
    .input('tamano',         sql.NVarChar(120), data.tamano ?? null)
    .input('peso',           sql.NVarChar(120), data.peso ?? null)
    .input('ubicacion_code', sql.NVarChar(80),  data.ubicacion_code ?? null)
    .execute('core.usp_Indicio_Update');
  return r.recordset?.[0];
}

export async function indicioDelete(id: number, actor?: string) {
  const r = await getPool().request()
    .input('indicio_id', sql.BigInt, id)
    .input('actor', sql.NVarChar(128), actor ?? null)
    .execute('core.usp_Indicio_Delete');
  return r.recordset?.[0]?.affected === 1;
}
