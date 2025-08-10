# dicri-backend (Express + TypeScript)

API de DICRI. Usa SQL Server (SPs) vía mssql, seguridad con helmet/cors/rate limit, logging con pino, y Swagger en `/docs`.

## Requisitos

- Node.js LTS
- SQL Server (para desarrollo local puedes usar docker-compose de `dicri-infra`)

## Ejecutar en desarrollo
1) Copia variables
	- `cp .env.example .env`
2) Instala dependencias
	- `npm install`
3) Inicia el servidor
	- `npm run dev` (por defecto en :3000)

## Scripts
- `npm run dev` Hot reload (tsx watch)
- `npm run build` Compila a `dist/`
- `npm start` Arranca desde `dist/`
- `npx jest -i --json --outputFile=jest-report.json` Ejecuta pruebas unitarias (Jest)
- `npm run db:migrate` Ejecuta SQL de `db/init` (útil en dev)

## Pruebas
- Ubicación: `test/`
  - `hash.test.ts`: utilidades de hash
  - `jwt.test.ts`: firma/verificación de tokens
  - `health.route.test.ts`: endpoint de salud (mock de DB)
- Ejecuta: `npx jest -i --json --outputFile=jest-report.json`

## Estructura
- `src/server.ts`: bootstrap de Express y middlewares
- `src/routes/*`: routers (auth, rbac, catalogs, expedientes, adjuntos, etc.)
- `src/services/*`: antivirus, almacenamiento (MinIO), mailer, etc.
- `src/utils/*`: utilidades (jwt, hash)
- `db/init/*`: scripts SQL (esquema, SPs)

## Variables de entorno
Revisa `.env.example` para la lista completa:
- DB_* para SQL Server
- JWT_* para tokens de acceso/refresh
- CORS_ORIGIN para orígenes permitidos
- MINIO_* para almacenamiento de adjuntos
