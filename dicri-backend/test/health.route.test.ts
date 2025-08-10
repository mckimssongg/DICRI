import request from 'supertest';
import express from 'express';
import { healthRouter } from '../src/routes/health';

// Mock de DB pool para no requerir SQL Server en tests unitarios
jest.mock('../src/db/pool', () => ({
  getPool: () => ({
    request: () => ({ execute: async () => ({ recordset: [{ ok: 1 }] }) })
  })
}));

describe('routes/health', () => {
  const app = express();
  app.use('/api/v1/health', healthRouter);

  it('GET /api/v1/health responde ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: 'up' });
  });
});
