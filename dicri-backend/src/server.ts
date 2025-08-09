import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/swagger';
import { randomUUID } from 'crypto';
import { createPool } from './db/pool';
import { healthRouter } from './routes/health';
import authRouter from './routes/auth'; 
import rbacRouter from './routes/rbac';
import catalogsRouter from './routes/catalogs';

const app = express();

import { Request, Response, NextFunction } from 'express';

const requestId = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || randomUUID();
  next();
};

app.use(requestId);
app.use(pinoHttp());
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(cookieParser());

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/rbac', rbacRouter);
app.use('/api/v1/catalogs', catalogsRouter);

app.get('/api-docs.json', (_req, res) => res.json(openApiSpec));
app.use('/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: { persistAuthorization: true },
  })
);

const port = parseInt(process.env.PORT || '3000', 10);

createPool().then(() => {
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}).catch((err) => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
