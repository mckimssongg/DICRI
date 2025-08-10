import sql from 'mssql';
import { getPool } from '../db/pool';

export async function listCatalogItems(catalogKey: string) {
  const r = await getPool().request()
    .input('catalog_key', sql.NVarChar(80), catalogKey)
    .execute('core.usp_CatalogItem_List');
  return r.recordset as { item_id:number; catalog_key:string; code:string; label:string; is_active:boolean; sort_order:number }[];
}

export async function createCatalogItem(catalogKey: string, code: string, label: string, sort = 0) {
  const r = await getPool().request()
    .input('catalog_key', sql.NVarChar(80), catalogKey)
    .input('code', sql.NVarChar(80), code)
    .input('label', sql.NVarChar(200), label)
    .input('sort_order', sql.Int, sort)
    .execute('core.usp_CatalogItem_Create');
  return r.recordset?.[0];
}

export async function updateCatalogItem(itemId: number, label: string, isActive: boolean, sort: number) {
  const r = await getPool().request()
    .input('item_id', sql.Int, itemId)
    .input('label', sql.NVarChar(200), label)
    .input('is_active', sql.Bit, isActive)
    .input('sort_order', sql.Int, sort)
    .execute('core.usp_CatalogItem_Update');
  return r.recordset?.[0];
}

export async function deleteCatalogItem(itemId: number) {
  const r = await getPool().request()
    .input('item_id', sql.Int, itemId)
    .execute('core.usp_CatalogItem_Delete');
  return r.recordset?.[0];
}
