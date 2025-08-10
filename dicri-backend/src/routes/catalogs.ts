import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { listCatalogItems, createCatalogItem, updateCatalogItem, deleteCatalogItem } from '../services/catalogs';

const router = Router();
const keyParam = z.object({ catalogKey: z.string().min(2).max(80) });

router.get('/:catalogKey/items', authGuard(), rbacGuard(['catalogs.read','catalogs.write']), async (req, res) => {
  const { catalogKey } = keyParam.parse(req.params);
  res.json(await listCatalogItems(catalogKey));
});

const createSchema = z.object({
  code: z.string().min(1).max(80),
  label: z.string().min(1).max(200),
  sort_order: z.number().int().min(0).default(0),
});
router.post('/:catalogKey/items', authGuard(), rbacGuard(['catalogs.write']), async (req, res) => {
  const { catalogKey } = keyParam.parse(req.params);
  const body = createSchema.parse(req.body);
  const out = await createCatalogItem(catalogKey, body.code, body.label, body.sort_order);
  res.status(201).json(out);
});

const updateSchema = z.object({
  label: z.string().min(1).max(200),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});
router.put('/items/:itemId', authGuard(), rbacGuard(['catalogs.write']), async (req, res) => {
  const itemId = Number(req.params.itemId);
  const body = updateSchema.parse(req.body);
  const out = await updateCatalogItem(itemId, body.label, body.is_active, body.sort_order);
  res.json(out);
});

router.delete('/items/:itemId', authGuard(), rbacGuard(['catalogs.write']), async (req, res) => {
  const itemId = Number(req.params.itemId);
  const out = await deleteCatalogItem(itemId);
  res.status((out?.affected ? 204 : 404)).send();
});

export default router;
