import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { favorites, videos, users } from '../db/schema.js';
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

// GET /api/favorites
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, minio_key: videos.minio_key, status: videos.status,
        categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, vistas: videos.vistas, duracion: videos.duracion,
        created_at: videos.created_at, added_at: favorites.added_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(favorites)
      .innerJoin(videos, eq(favorites.video_id, videos.id))
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(favorites.user_id, req.user.sub))
      .orderBy(favorites.added_at);

    res.json({ status: 'success', data: rows.map(formatVideo) });
  } catch (err) { next(err); }
});

// POST /api/favorites/:videoId
router.post('/:videoId', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.videoId);
    await db.insert(favorites).values({ user_id: req.user.sub, video_id: videoId }).onDuplicateKeyUpdate({ set: { added_at: new Date() } });
    res.json({ status: 'success', data: { message: 'Añadido a favoritos' } });
  } catch (err) { next(err); }
});

// DELETE /api/favorites/:videoId
router.delete('/:videoId', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.videoId);
    await db.delete(favorites).where(
      and(eq(favorites.user_id, req.user.sub), eq(favorites.video_id, videoId))
    );
    res.json({ status: 'success', data: { message: 'Eliminado de favoritos' } });
  } catch (err) { next(err); }
});

export default router;
