import * as Minio from 'minio';
import { env } from './env.js';

export const BUCKET = env.minio.bucket;

export const minioClient = new Minio.Client({
  endPoint:  env.minio.endPoint,
  port:      env.minio.port,
  useSSL:    false,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey,
});

const PUBLIC_PREFIXES = ['avatars', 'banners', 'covers', 'pdfs', 'thumbnails', 'subtitles'];

export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) await minioClient.makeBucket(BUCKET);

    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: PUBLIC_PREFIXES.map(p => `arn:aws:s3:::${BUCKET}/${p}/*`),
      }],
    };
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  } catch (err) {
    console.warn('MinIO bucket setup warning:', err.message);
  }
}

export function mediaUrl(key) {
  if (!key) return null;
  return `http://${env.minio.endPoint}:${env.minio.port}/${BUCKET}/${key}`;
}

export async function putBuffer(key, buffer, mimetype) {
  await minioClient.putObject(BUCKET, key, buffer, buffer.length, { 'Content-Type': mimetype });
  return key;
}

export async function deleteObject(key) {
  try { await minioClient.removeObject(BUCKET, key); } catch {}
}
