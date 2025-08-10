import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { expedienteCreate, expedienteDelete, expedienteGetById, expedienteList } from '../services/expedientes';
import { expedienteApprove, expedienteReject, expedienteSubmit } from '../services/revision';

const router = Router();

const CreateSchema = z.object({
  sede_codigo: z.string().min(2).max(10),
  fecha_registro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_registro inválida (YYYY-MM-DD)'),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().max(2000).optional()
});

router.post('/',
  authGuard(),
  rbacGuard(['expediente.create']),
  async (req, res) => {
    const p = CreateSchema.parse(req.body);
    const tecnicoId = req.auth!.sub;
    const out = await expedienteCreate({ ...p, tecnico_id: tecnicoId });
    res.status(201).json(out);
  }
);

router.get('/:id',
  authGuard(),
  rbacGuard(['expediente.read','expediente.update','expediente.review']),
  async (req, res) => {
    const id = Number(req.params.id);
    const exp = await expedienteGetById(id);
    if (!exp) return res.status(404).json({ error: 'No encontrado' });
    res.json(exp);
  }
);

const ListQuery = z.object({
  folio: z.string().optional(),
  sede_codigo: z.string().optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/',
  authGuard(),
  rbacGuard(['expediente.read','expediente.update','expediente.review']),
  async (req, res) => {
    const q = ListQuery.parse(req.query);
    const out = await expedienteList(q);
    res.json(out);
  }
);

router.delete('/:id',
  authGuard(),
  rbacGuard(['expediente.update','expediente.review']), // opcional: limitar a admin/coordinador
  async (req, res) => {
    const ok = await expedienteDelete(Number(req.params.id), req.auth!.username);
    return res.status(ok ? 204 : 404).send();
  }
);

/* POST /expedientes/:id/submit */
router.post('/:id/submit',
  authGuard(),
  rbacGuard(['expediente.update','expediente.create']), // quien crea puede enviar a revisión
  async (req, res) => {
    await expedienteSubmit(Number(req.params.id), req.auth!.sub);
    res.status(200).json({ status: 'ok' });
  }
);

/* POST /expedientes/:id/approve */
router.post('/:id/approve',
  authGuard(),
  rbacGuard(['expediente.review']), // coordinador
  async (req, res) => {
    await expedienteApprove(Number(req.params.id), req.auth!.sub);
    res.status(200).json({ status: 'ok' });
  }
);

/* POST /expedientes/:id/reject */
const RejectSchema = z.object({ motivo: z.string().min(5).max(1000) });
router.post('/:id/reject',
  authGuard(),
  rbacGuard(['expediente.review']), // coordinador
  async (req, res) => {
    const { motivo } = RejectSchema.parse(req.body);
    await expedienteReject(Number(req.params.id), req.auth!.sub, motivo);
    res.status(200).json({ status: 'ok' });
  }
);

export default router;
