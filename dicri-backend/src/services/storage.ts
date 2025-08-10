import { Client as MinioClient } from 'minio';
import { randomUUID } from 'crypto';

const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: (process.env.MINIO_USE_SSL || 'false') === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'dicri',
  secretKey: process.env.MINIO_SECRET_KEY || 'dicri_secret',
});

const bucket = process.env.MINIO_BUCKET || 'dicri-attachments';

export async function ensureBucket() {
  const exists = await minio.bucketExists(bucket).catch(() => false);
  if (!exists) await minio.makeBucket(bucket, 'us-east-1');
}

export function buildObjectKey(expedienteId: number, originalName: string) {
  const safe = originalName.replace(/[^\w.\-]/g, '_').slice(0, 120);
  return `exp/${expedienteId}/${randomUUID()}-${safe}`;
}

export async function putObject(objectKey: string, data: Buffer, mime: string) {
  await minio.putObject(bucket, objectKey, data, data.length, { 'Content-Type': mime });
}

export async function getPresignedGetUrl(objectKey: string, expirySec = 60) {
  const url = await minio.presignedGetObject(bucket, objectKey, expirySec);
  const pub = process.env.MINIO_PUBLIC_URL;
  if (pub) {
    try {
      const u = new URL(url);
      const b = new URL(pub);
      u.protocol = b.protocol;
      u.host = b.host; // incluye hostname:puerto
      return u.toString();
    } catch {
      // si falla, devolvemos el original
    }
  }
  return url;
}

export async function removeObject(objectKey: string) {
  try { await minio.removeObject(bucket, objectKey); } catch { /* idempotente */ }
}
