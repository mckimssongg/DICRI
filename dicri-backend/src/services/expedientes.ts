import sql from 'mssql';
import { getPool } from '../db/pool';

export type ExpedienteCreateInput = {
  sede_codigo: string;
  fecha_registro: string; // ISO date
  titulo: string;
  descripcion?: string | null;
  tecnico_id: number;
};

export async function expedienteCreate(input: ExpedienteCreateInput) {
  const r = await getPool().request()
    .input('sede_codigo',  sql.NVarChar(10),  input.sede_codigo)
    .input('fecha_registro', sql.Date,        input.fecha_registro)
    .input('titulo',       sql.NVarChar(200), input.titulo)
    .input('descripcion',  sql.NVarChar(2000),input.descripcion ?? null)
    .input('tecnico_id',   sql.BigInt,        input.tecnico_id)
    .execute('core.usp_Expediente_Create');

  return r.recordset?.[0] as { expediente_id: number; folio: string };
}

export async function expedienteGetById(id: number) {
  const r = await getPool().request()
    .input('id', sql.BigInt, id)
    .execute('core.usp_Expediente_GetById');
  return r.recordset?.[0] ?? null;
}

export async function expedienteList(params: {
  folio?: string;
  sede_codigo?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}) {
  const req = getPool().request()
    .input('folio',       sql.NVarChar(32), params.folio ?? null)
    .input('sede_codigo', sql.NVarChar(10), params.sede_codigo ?? null)
    .input('desde',       sql.Date, params.desde ?? null)
    .input('hasta',       sql.Date, params.hasta ?? null)
    .input('page',        sql.Int,  params.page ?? 1)
    .input('pageSize',    sql.Int,  params.pageSize ?? 20);

  const r = await req.execute('core.usp_Expediente_List');
  const items = Array.isArray(r.recordsets) ? r.recordsets[0] ?? [] : [];
  const total = Array.isArray(r.recordsets) && r.recordsets[1]?.[0]?.total ? r.recordsets[1][0].total : 0;
  return { items, total };
}

export async function expedienteDelete(id: number, actor?: string) {
  const r = await getPool().request()
    .input('id', sql.BigInt, id)
    .input('actor', sql.NVarChar(128), actor ?? null)
    .execute('core.usp_Expediente_Delete');
  return r.recordset?.[0]?.affected === 1;
}

export async function expedienteUpdate(id:number, data:{
  sede_codigo: string; fecha_registro: string; titulo: string; descripcion?: string|null;
}) {
  const r = await getPool().request()
    .input('id', sql.BigInt, id)
    .input('sede_codigo', sql.NVarChar(10), data.sede_codigo)
    .input('fecha_registro', sql.Date, data.fecha_registro)
    .input('titulo', sql.NVarChar(200), data.titulo)
    .input('descripcion', sql.NVarChar(2000), data.descripcion ?? null)
    .execute('core.usp_Expediente_Update');
  return r.recordset?.[0]?.affected === 1;
}
