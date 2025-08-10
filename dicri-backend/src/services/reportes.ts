import sql from 'mssql';
import { getPool } from '../db/pool';

export async function reportesExpedientes(params: { desde?: string; hasta?: string }) {
  const r = await getPool().request()
    .input('desde', sql.Date, params.desde ?? null)
    .input('hasta', sql.Date, params.hasta ?? null)
    .execute('core.usp_Reportes_Expedientes');

  const recordsets = r.recordsets as sql.IRecordSet<any>[] | undefined;
  const byEstado = recordsets?.[0] ?? [];
  const aprobRechPorFecha = recordsets?.[1] ?? [];
  const porSede = recordsets?.[2] ?? [];
  return { byEstado, aprobRechPorFecha, porSede };
}
