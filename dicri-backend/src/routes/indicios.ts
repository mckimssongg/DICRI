import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { indicioCreate, indiciosListByExpediente, indicioUpdate, indicioDelete } from '../services/indicios';

const router = Router();

const CreateSchema = z.object({
  tipo_code: z.string().min(1).max(80),
  descripcion: z.string().max(2000).optional(),
  color_code: z.string().max(80).optional(),
  tamano: z.string().max(120).optional(),
  peso: z.string().max(120).optional(),
  ubicacion_code: z.string().max(80).optional()
});

/* POST /expedientes/:id/indicios */
router.post('/expedientes/:id/indicios',
  authGuard(),
  rbacGuard(['indicio.create']),
  async (req, res) => {
    const expedienteId = Number(req.params.id);
    const p = CreateSchema.parse(req.body);
    const out = await indicioCreate({
      expediente_id: expedienteId,
      tecnico_id: req.auth!.sub,
      ...p
    });
    res.status(201).json(out);
  }
);

/* GET /expedientes/:id/indicios */
router.get('/expedientes/:id/indicios',
  authGuard(),
  rbacGuard(['indicio.read','expediente.read','expediente.update','expediente.review']),
  async (req, res) => {
    const expedienteId = Number(req.params.id);
    res.json(await indiciosListByExpediente(expedienteId));
  }
);

/* PUT /indicios/:id */
const UpdateSchema = CreateSchema.extend({
  tipo_code: z.string().min(1).max(80)
});
router.put('/indicios/:id',
  authGuard(),
  rbacGuard(['indicio.update']),
  async (req, res) => {
    const id = Number(req.params.id);
    const p = UpdateSchema.parse(req.body);
    const r = await indicioUpdate(id, p);
    if (!r?.affected) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  }
);

/* DELETE /indicios/:id */
router.delete('/indicios/:id',
  authGuard(),
  rbacGuard(['indicio.update']),
  async (req, res) => {
    const ok = await indicioDelete(Number(req.params.id), req.auth!.username);
    res.status(ok ? 204 : 404).send();
  }
);

export default router;
