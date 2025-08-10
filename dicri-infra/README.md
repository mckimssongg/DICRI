# dicri-infra

Infra local para demo con Docker Compose.
- SQL Server 2022
- API (dicri-backend)
- Web (dicri-frontend)
- MinIO

## Uso
1. Copiar `env.backend.example` a `../dicri-backend/.env`
2. Desde esta carpeta, ejecutar:
   ```bash
   docker compose build
   docker compose up -d
   ```
3. Inicializar la DB (desde el contenedor o local):
   ```bash
   # dentro de dicri-backend
   npm install
   npm run db:migrate
   ```
4. Verificar health:
   - API: http://localhost:3000/api/v1/health
   - Web: http://localhost:5173
