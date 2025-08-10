import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authGuard } from '../middlewares/authGuard';
import { rbacGuard } from '../middlewares/rbacGuard';
import { sha256 } from '../utils/hash';
import { scanBuffer } from '../services/antivirus';
import { adjuntoCreate, adjuntoDelete, adjuntoGetById, adjuntoUpdateScan, adjuntosListByExpediente } from '../services/attachments';
import { buildObjectKey, ensureBucket, getPresignedGetUrl, putObject, removeObject, getObjectStream, statObject } from '../services/storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB en memoria

const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg','image/png'
]);

/* Subir adjunto */
router.post('/expedientes/:id/adjuntos',
  authGuard(),
  rbacGuard(['expediente.update','expediente.create','expediente.read']),
  upload.single('file'),
  async (req, res) => {
    const expedienteId = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido (campo "file")' });

    const file = req.file;
    if (!ALLOWED.has(file.mimetype)) {
      return res.status(415).json({ error: 'Tipo de archivo no permitido' });
    }
    if (!file.buffer) {
      return res.status(400).json({ error: 'Carga inválida: no se recibió contenido' });
    }

    await ensureBucket();

    // Hash + AV
    const hash = sha256(file.buffer);
    const scan = await scanBuffer(file.buffer);

    // Guardar objeto solo si está limpio o el AV está deshabilitado/error (guardamos, pero marcamos estado)
    const objectKey = buildObjectKey(expedienteId, file.originalname);
    await putObject(objectKey, file.buffer, file.mimetype);

    // Crear registro
    const created = await adjuntoCreate({
      expediente_id: expedienteId,
      archivo_nombre: file.originalname,
      mime: file.mimetype,
      tamano_bytes: file.size,
      sha256: hash,
      storage_key: objectKey,
      creado_por: req.auth!.sub
    });

    // Actualizar estado de escaneo
    await adjuntoUpdateScan(created.adjunto_id, scan.status, scan.details);

    if (scan.status === 'INFECTED') {
      // Políticas: podrías borrar el objeto si infectado
      await removeObject(objectKey);
      return res.status(422).json({ error: 'Archivo infectado', details: scan.details });
    }

    return res.status(201).json({ adjunto_id: created.adjunto_id });
  }
);

/* Listar adjuntos de expediente */
router.get('/expedientes/:id/adjuntos',
  authGuard(),
  rbacGuard(['expediente.read','expediente.update','expediente.review']),
  async (req, res) => {
    const expedienteId = Number(req.params.id);
    const items = await adjuntosListByExpediente(expedienteId);
    res.json(items);
  }
);

/* Descargar (URL firmada corta) */
router.get('/adjuntos/:adjuntoId/download',
  authGuard(),
  rbacGuard(['expediente.read','expediente.update','expediente.review']),
  async (req, res) => {
    const adj = await adjuntoGetById(Number(req.params.adjuntoId));
    if (!adj) return res.status(404).json({ error: 'No encontrado' });
    if (adj.scan_status === 'PENDING') return res.status(409).json({ error: 'Escaneando, intenta más tarde' });
    if (adj.scan_status === 'INFECTED') return res.status(423).json({ error: 'Archivo bloqueado por infección' });

    // Stream directo desde MinIO para evitar problemas de firma/host
    const meta = await statObject(adj.storage_key);
    const stream = await getObjectStream(adj.storage_key);
  const contentType = adj.mime || meta?.metaData?.['content-type'] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(adj.archivo_nombre)}"`);
  res.setHeader('X-Filename', encodeURIComponent(adj.archivo_nombre));
    if (meta?.size) res.setHeader('Content-Length', String(meta.size));
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  }
);

/* Eliminar (soft delete + limpiar objeto) */
router.delete('/adjuntos/:adjuntoId',
  authGuard(),
  rbacGuard(['expediente.update','expediente.review']),
  async (req, res) => {
    const adj = await adjuntoGetById(Number(req.params.adjuntoId));
    if (!adj) return res.status(404).json({ error: 'No encontrado' });
    const ok = await adjuntoDelete(adj.adjunto_id, req.auth!.username);
    await removeObject(adj.storage_key);
    res.status(ok ? 204 : 404).send();
  }
);

export default router;
