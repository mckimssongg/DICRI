import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { expedienteCreate, expedienteDelete, expedienteGetById, expedienteList } from '../services/expedientes';

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

export default router;
