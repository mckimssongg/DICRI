import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { reportesExpedientes } from '../services/reportes';

const router = Router();

const Query = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

router.get('/reportes/expedientes',
  authGuard(),
  rbacGuard(['reportes.read']),
  async (req, res) => {
    const q = Query.parse(req.query);
    const data = await reportesExpedientes(q);
    res.json(data);
  }
);

export default router;
