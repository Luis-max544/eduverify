import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { history, videos, users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

function base() { return `http://localhost:${env.port}`; }

function formatVideo(v) {
  return {
    ...v,
    author_avatar_url: v.author_avatar_url ? `${base()}/uploads/${v.author_avatar_url}` : null,
  };
}

// GET /api/history
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);

    const rows = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, minio_key: videos.minio_key, status: videos.status,
        categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, vistas: videos.vistas, duracion: videos.duracion,
        created_at: videos.created_at, watched_at: history.watched_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(history)
      .innerJoin(videos, eq(history.video_id, videos.id))
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(history.user_id, req.user.sub))
      .orderBy(desc(history.watched_at))
      .limit(limit);

    res.json({ status: 'success', data: rows.map(formatVideo) });
  } catch (err) { next(err); }
});

// POST /api/history/:videoId — upsert
router.post('/:videoId', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.videoId);
    await db.insert(history)
      .values({ user_id: req.user.sub, video_id: videoId })
      .onDuplicateKeyUpdate({ set: { watched_at: new Date() } });
    res.json({ status: 'success', data: { message: 'Historial actualizado' } });
  } catch (err) { next(err); }
});

// DELETE /api/history — clear all
router.delete('/', verifyToken, async (req, res, next) => {
  try {
    await db.delete(history).where(eq(history.user_id, req.user.sub));
    res.json({ status: 'success', data: { message: 'Historial eliminado' } });
  } catch (err) { next(err); }
});

// DELETE /api/history/:videoId
router.delete('/:videoId', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.videoId);
    await db.delete(history).where(
      and(eq(history.user_id, req.user.sub), eq(history.video_id, videoId))
    );
    res.json({ status: 'success', data: { message: 'Entrada eliminada del historial' } });
  } catch (err) { next(err); }
});

export default router;
