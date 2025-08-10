#!/bin/sh
set -e

echo "⏳ Esperando a que MinIO esté listo..."
until curl -s http://minio:9000/minio/health/ready > /dev/null; do
  sleep 2
done

echo "MinIO listo. Creando bucket 'dicri-attachments'..."

mc alias set local http://minio:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api s3v4
mc mb -p local/"$MINIO_BUCKET" || echo "ℹ️ El bucket ya existe"
mc policy set public local/"$MINIO_BUCKET"

echo "🎉 Bucket '$MINIO_BUCKET' creado/configurado."
