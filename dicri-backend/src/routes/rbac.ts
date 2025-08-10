import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { listRoles, listPermissions, grant, revoke, userPermissions } from '../services/rbac';

export const rbacRouter = Router();

rbacRouter.get('/roles', authGuard(), rbacGuard(['roles.read','roles.write']), async (_req, res) => {
  res.json(await listRoles());
});

rbacRouter.get('/permissions', authGuard(), rbacGuard(['perms.read','perms.write']), async (_req, res) => {
  res.json(await listPermissions());
});

const GrantSchema = z.object({ roleKey: z.string().min(2), permKey: z.string().min(2) });

rbacRouter.post('/grant', authGuard(), rbacGuard(['perms.write']), async (req, res) => {
  const p = GrantSchema.parse(req.body);
  await grant(p.roleKey, p.permKey, req.auth!.username);
  res.status(204).send();
});

rbacRouter.post('/revoke', authGuard(), rbacGuard(['perms.write']), async (req, res) => {
  const p = GrantSchema.parse(req.body);
  await revoke(p.roleKey, p.permKey, req.auth!.username);
  res.status(204).send();
});

rbacRouter.get('/me/permissions', authGuard(), async (req, res) => {
  const perms = await userPermissions(req.auth!.sub);
  res.json({ permissions: perms });
});

export default rbacRouter;
