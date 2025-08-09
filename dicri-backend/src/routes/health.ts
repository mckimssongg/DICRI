import { Router } from 'express';
import { getPool } from '../db/pool';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().execute('core.usp_Health_Ping');
    const ok = result.recordset?.[0]?.ok === 1;
    res.json({ ok: !!ok, db: 'up' });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});
