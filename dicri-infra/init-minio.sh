#!/bin/sh
set -e

echo "⏳ Esperando a que MinIO acepte conexiones (mc alias set)..."
until mc alias set local http://minio:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api s3v4 >/dev/null 2>&1; do
  sleep 2
done

echo "MinIO listo. Creando/configurando bucket '$MINIO_BUCKET'..."
mc mb -p local/"$MINIO_BUCKET" >/dev/null 2>&1 || echo "ℹ️ El bucket ya existe"
mc policy set public local/"$MINIO_BUCKET" >/dev/null 2>&1 || true

echo "🎉 Bucket '$MINIO_BUCKET' listo."
