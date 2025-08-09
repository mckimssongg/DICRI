# dicri-backend (Node + Express + TypeScript)

API de DICRI. Conexión a SQL Server usando TypeORM (solo para conexión/txs), SP para CRUD.
Seguridad (helmet, cors, rate limit), logging (pino), métricas `/metrics`, health `/health`.

## Scripts
- `npm run dev` hot reload
- `npm run build && npm start` producción
- `npm run db:migrate` ejecuta SQL en `db/init` contra la instancia (útil en dev)
