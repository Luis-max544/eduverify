import { Router } from 'express';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { profesorPlaylists, profesorPlaylistVideos, videos, users, courseReviews } from '../db/schema.js';
import { verifyToken, requireRol } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

function base() { return `http://localhost:${env.port}`; }

async function getWithVideos(userId) {
  const pls = await db.select().from(profesorPlaylists).where(eq(profesorPlaylists.user_id, userId));

  const ratings = pls.length
    ? await db
        .select({
          playlist_id: courseReviews.playlist_id,
          promedio: sql`AVG(${courseReviews.estrellas})`,
          total: sql`COUNT(*)`,
        })
        .from(courseReviews)
        .where(inArray(courseReviews.playlist_id, pls.map(p => p.id)))
        .groupBy(courseReviews.playlist_id)
    : [];
  const ratingByPl = new Map(ratings.map(r => [r.playlist_id, r]));

  return Promise.all(pls.map(async (pl) => {
    const rows = await db
      .select({
        id: videos.id, titulo: videos.titulo, url_video: videos.url_video,
        categoria: videos.categoria, duracion: videos.duracion, vistas: videos.vistas,
        orden: profesorPlaylistVideos.orden,
        autor: users.nombre, author_avatar_url: users.avatar_path,
      })
      .from(profesorPlaylistVideos)
      .innerJoin(videos, eq(profesorPlaylistVideos.video_id, videos.id))
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(profesorPlaylistVideos.playlist_id, pl.id))
      .orderBy(profesorPlaylistVideos.orden);

    const rating = ratingByPl.get(pl.id);
    return {
      ...pl,
      promedio_estrellas: rating ? Number(Number(rating.promedio).toFixed(1)) : null,
      total_reviews: rating ? Number(rating.total) : 0,
      videos: rows.map(v => ({
        ...v,
        author_avatar_url: v.author_avatar_url ? `${base()}/uploads/${v.author_avatar_url}` : null,
      })),
    };
  }));
}

async function ownerCheck(playlistId, userId, res) {
  const [pl] = await db.select({ user_id: profesorPlaylists.user_id }).from(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
  if (!pl) { res.status(404).json({ status: 'error', message: 'Playlist no encontrada' }); return null; }
  if (pl.user_id !== userId) { res.status(403).json({ status: 'error', message: 'No autorizado' }); return null; }
  return pl;
}

// GET /api/profesor/playlists (own)
router.get('/', verifyToken, requireRol('profesor', 'creador'), async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await getWithVideos(req.user.sub) });
  } catch (err) { next(err); }
});

// GET /api/users/:userId/profesor/playlists (public)
router.get('/public/:userId', async (req, res, next) => {
  try {
    res.json({ status: 'success', data: await getWithVideos(Number(req.params.userId)) });
  } catch (err) { next(err); }
});

// POST /api/profesor/playlists
router.post('/', verifyToken, requireRol('profesor', 'creador'), async (req, res, next) => {
  try {
    const { nombre } = z.object({ nombre: z.string().min(1).max(255) }).parse(req.body);
    const [result] = await db.insert(profesorPlaylists).values({ user_id: req.user.sub, nombre });
    const [created] = await db.select().from(profesorPlaylists).where(eq(profesorPlaylists.id, result.insertId));
    res.status(201).json({ status: 'success', data: { ...created, videos: [] } });
  } catch (err) { next(err); }
});

// PATCH /api/profesor/playlists/:id
router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const cambios = z.object({
      nombre: z.string().min(1).max(255).optional(),
      descripcion: z.string().max(5000).nullable().optional(),
    }).refine(o => o.nombre !== undefined || o.descripcion !== undefined, {
      message: 'Se requiere al menos un campo (nombre o descripcion)',
    }).parse(req.body);

    await db.update(profesorPlaylists).set(cambios).where(eq(profesorPlaylists.id, playlistId));
    const [updated] = await db.select().from(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
    res.json({ status: 'success', data: updated });
  } catch (err) { next(err); }
});

// PUT /api/profesor/playlists/:id/orden — reordenar lecciones
router.put('/:id/orden', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const { orden } = z.object({ orden: z.array(z.number().int().positive()).min(1) }).parse(req.body);

    const actuales = await db
      .select({ video_id: profesorPlaylistVideos.video_id })
      .from(profesorPlaylistVideos)
      .where(eq(profesorPlaylistVideos.playlist_id, playlistId));
    const idsActuales = new Set(actuales.map(r => r.video_id));

    if (orden.length !== idsActuales.size || !orden.every(id => idsActuales.has(id))) {
      return res.status(400).json({ status: 'error', message: 'El orden debe incluir exactamente los videos de la playlist' });
    }

    // Updates por par (PK compuesta) — no delete+insert
    for (let i = 0; i < orden.length; i++) {
      await db.update(profesorPlaylistVideos)
        .set({ orden: i })
        .where(and(
          eq(profesorPlaylistVideos.playlist_id, playlistId),
          eq(profesorPlaylistVideos.video_id, orden[i]),
        ));
    }
    res.json({ status: 'success', data: { message: 'Orden actualizado' } });
  } catch (err) { next(err); }
});

// DELETE /api/profesor/playlists/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;
    await db.delete(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
    res.json({ status: 'success', data: { message: 'Playlist eliminada' } });
  } catch (err) { next(err); }
});

// POST /api/profesor/playlists/:id/videos/:videoId
router.post('/:id/videos/:videoId', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const videoId = Number(req.params.videoId);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const { orden } = z.object({ orden: z.number().int().default(0) }).parse(req.body);
    await db.insert(profesorPlaylistVideos).values({ playlist_id: playlistId, video_id: videoId, orden })
      .onDuplicateKeyUpdate({ set: { orden } });
    res.json({ status: 'success', data: { message: 'Video añadido' } });
  } catch (err) { next(err); }
});

// DELETE /api/profesor/playlists/:id/videos/:videoId
router.delete('/:id/videos/:videoId', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const videoId = Number(req.params.videoId);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;
    await db.delete(profesorPlaylistVideos).where(
      and(eq(profesorPlaylistVideos.playlist_id, playlistId), eq(profesorPlaylistVideos.video_id, videoId))
    );
    res.json({ status: 'success', data: { message: 'Video eliminado' } });
  } catch (err) { next(err); }
});

export default router;
