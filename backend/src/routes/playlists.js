import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { playlists, playlistVideos, videos, users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

function base() { return `http://localhost:${env.port}`; }

async function getPlaylistsWithVideos(userId) {
  const userPlaylists = await db.select().from(playlists).where(eq(playlists.user_id, userId));

  return Promise.all(userPlaylists.map(async (pl) => {
    const pvRows = await db
      .select({
        id: videos.id, titulo: videos.titulo, url_video: videos.url_video,
        categoria: videos.categoria, duracion: videos.duracion, vistas: videos.vistas,
        es_premium: videos.es_premium, tipo: videos.tipo,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(playlistVideos)
      .innerJoin(videos, eq(playlistVideos.video_id, videos.id))
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(playlistVideos.playlist_id, pl.id));

    return {
      ...pl,
      videos: pvRows.map(v => ({
        ...v,
        author_avatar_url: v.author_avatar_url ? `${base()}/uploads/${v.author_avatar_url}` : null,
      })),
    };
  }));
}

// GET /api/playlists
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const data = await getPlaylistsWithVideos(req.user.sub);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

// POST /api/playlists
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { nombre } = z.object({ nombre: z.string().min(1).max(255) }).parse(req.body);
    const [result] = await db.insert(playlists).values({ user_id: req.user.sub, nombre });
    const [created] = await db.select().from(playlists).where(eq(playlists.id, result.insertId));
    res.status(201).json({ status: 'success', data: { ...created, videos: [] } });
  } catch (err) { next(err); }
});

// DELETE /api/playlists/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const [pl] = await db.select({ user_id: playlists.user_id }).from(playlists).where(eq(playlists.id, playlistId));
    if (!pl) return res.status(404).json({ status: 'error', message: 'Playlist no encontrada' });
    if (pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });

    await db.delete(playlists).where(eq(playlists.id, playlistId));
    res.json({ status: 'success', data: { message: 'Playlist eliminada' } });
  } catch (err) { next(err); }
});

// POST /api/playlists/:id/videos/:videoId
router.post('/:id/videos/:videoId', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const videoId = Number(req.params.videoId);

    const [pl] = await db.select({ user_id: playlists.user_id }).from(playlists).where(eq(playlists.id, playlistId));
    if (!pl) return res.status(404).json({ status: 'error', message: 'Playlist no encontrada' });
    if (pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });

    await db.insert(playlistVideos).values({ playlist_id: playlistId, video_id: videoId })
      .onDuplicateKeyUpdate({ set: { added_at: new Date() } });
    res.json({ status: 'success', data: { message: 'Video añadido a la playlist' } });
  } catch (err) { next(err); }
});

// DELETE /api/playlists/:id/videos/:videoId
router.delete('/:id/videos/:videoId', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const videoId = Number(req.params.videoId);

    const [pl] = await db.select({ user_id: playlists.user_id }).from(playlists).where(eq(playlists.id, playlistId));
    if (!pl) return res.status(404).json({ status: 'error', message: 'Playlist no encontrada' });
    if (pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });

    await db.delete(playlistVideos).where(
      and(eq(playlistVideos.playlist_id, playlistId), eq(playlistVideos.video_id, videoId))
    );
    res.json({ status: 'success', data: { message: 'Video eliminado de la playlist' } });
  } catch (err) { next(err); }
});

export default router;
