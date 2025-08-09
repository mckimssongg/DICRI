import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { createPool } from './db/pool';
import { healthRouter } from './routes/health';

const app = express();

const requestId = (req, _res, next) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || randomUUID();
  next();
};

app.use(requestId);
app.use(pinoHttp());
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.use('/api/v1/health', healthRouter);

const port = parseInt(process.env.PORT || '3000', 10);

createPool().then(() => {
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}).catch((err) => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
