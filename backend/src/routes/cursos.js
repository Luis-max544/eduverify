import { Router } from 'express';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import {
  profesorPlaylists, profesorPlaylistVideos, videos, users,
  courseEnrollments, lessonProgress, courseReviews,
} from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

function base() { return `http://localhost:${env.port}`; }
function avatarUrl(path) { return path ? `${base()}/uploads/${path}` : null; }

async function getCurso(playlistId) {
  const [pl] = await db.select().from(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
  return pl || null;
}

async function getLecciones(playlistId) {
  return db
    .select({
      id: videos.id, titulo: videos.titulo, url_video: videos.url_video,
      categoria: videos.categoria, duracion: videos.duracion, vistas: videos.vistas,
      descripcion: videos.descripcion, es_premium: videos.es_premium,
      orden: profesorPlaylistVideos.orden,
      autor: users.nombre, autor_id: videos.usuario_id, author_avatar_url: users.avatar_path,
    })
    .from(profesorPlaylistVideos)
    .innerJoin(videos, eq(profesorPlaylistVideos.video_id, videos.id))
    .innerJoin(users, eq(videos.usuario_id, users.id))
    .where(eq(profesorPlaylistVideos.playlist_id, playlistId))
    .orderBy(profesorPlaylistVideos.orden);
}

async function getRating(playlistId) {
  const [row] = await db
    .select({ promedio: sql`AVG(${courseReviews.estrellas})`, total: sql`COUNT(*)` })
    .from(courseReviews)
    .where(eq(courseReviews.playlist_id, playlistId));
  const total = Number(row?.total || 0);
  return {
    promedio_estrellas: total ? Number(Number(row.promedio).toFixed(1)) : null,
    total_reviews: total,
  };
}

async function estaInscrito(userId, playlistId) {
  const [row] = await db.select({ user_id: courseEnrollments.user_id }).from(courseEnrollments)
    .where(and(eq(courseEnrollments.user_id, userId), eq(courseEnrollments.playlist_id, playlistId)));
  return !!row;
}

// completadas cuenta solo lecciones que siguen en la playlist (JOIN) — no infla %
async function getProgreso(userId, playlistId) {
  const lecciones = await db
    .select({ video_id: profesorPlaylistVideos.video_id })
    .from(profesorPlaylistVideos)
    .where(eq(profesorPlaylistVideos.playlist_id, playlistId));
  const total = lecciones.length;

  const completadasRows = await db
    .select({ video_id: lessonProgress.video_id })
    .from(lessonProgress)
    .innerJoin(profesorPlaylistVideos, and(
      eq(lessonProgress.playlist_id, profesorPlaylistVideos.playlist_id),
      eq(lessonProgress.video_id, profesorPlaylistVideos.video_id),
    ))
    .where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.playlist_id, playlistId)));

  const completadas = completadasRows.map(r => r.video_id);
  return {
    completadas,
    total_lecciones: total,
    porcentaje: total ? Math.round((completadas.length / total) * 100) : 0,
  };
}

// GET /api/cursos/mis-cursos — antes de /:id (orden de rutas Express)
router.get('/mis-cursos', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const inscripciones = await db
      .select({
        id: profesorPlaylists.id, nombre: profesorPlaylists.nombre,
        descripcion: profesorPlaylists.descripcion,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
        enrolled_at: courseEnrollments.enrolled_at,
      })
      .from(courseEnrollments)
      .innerJoin(profesorPlaylists, eq(courseEnrollments.playlist_id, profesorPlaylists.id))
      .innerJoin(users, eq(profesorPlaylists.user_id, users.id))
      .where(eq(courseEnrollments.user_id, userId));

    const data = await Promise.all(inscripciones.map(async (c) => {
      const { completadas, total_lecciones, porcentaje } = await getProgreso(userId, c.id);
      const rating = await getRating(c.id);
      return {
        ...c,
        author_avatar_url: avatarUrl(c.author_avatar_url),
        completadas: completadas.length,
        total_lecciones,
        porcentaje,
        ...rating,
      };
    }));

    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

// GET /api/cursos/:id (pública)
router.get('/:id', async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const pl = await getCurso(playlistId);
    if (!pl) return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });

    const [autor] = await db
      .select({ id: users.id, nombre: users.nombre, avatar_path: users.avatar_path })
      .from(users).where(eq(users.id, pl.user_id));

    const lecciones = await getLecciones(playlistId);
    const [inscritosRow] = await db
      .select({ total: sql`COUNT(*)` }).from(courseEnrollments)
      .where(eq(courseEnrollments.playlist_id, playlistId));
    const rating = await getRating(playlistId);

    res.json({
      status: 'success',
      data: {
        id: pl.id,
        nombre: pl.nombre,
        descripcion: pl.descripcion,
        created_at: pl.created_at,
        autor: { id: autor.id, nombre: autor.nombre, avatar_url: avatarUrl(autor.avatar_path) },
        lecciones: lecciones.map(l => ({ ...l, author_avatar_url: avatarUrl(l.author_avatar_url) })),
        total_lecciones: lecciones.length,
        inscritos: Number(inscritosRow?.total || 0),
        ...rating,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/cursos/:id/progreso
router.get('/:id/progreso', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await getCurso(playlistId)) return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });

    const inscrito = await estaInscrito(req.user.sub, playlistId);
    const { completadas, porcentaje } = await getProgreso(req.user.sub, playlistId);
    res.json({ status: 'success', data: { inscrito, completadas, porcentaje } });
  } catch (err) { next(err); }
});

// POST /api/cursos/:id/inscripcion (upsert idempotente)
router.post('/:id/inscripcion', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await getCurso(playlistId)) return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });

    await db.insert(courseEnrollments)
      .values({ user_id: req.user.sub, playlist_id: playlistId })
      .onDuplicateKeyUpdate({ set: { user_id: req.user.sub } });
    res.json({ status: 'success', data: { message: 'Inscripción realizada' } });
  } catch (err) { next(err); }
});

// DELETE /api/cursos/:id/inscripcion (borra también progreso)
router.delete('/:id/inscripcion', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    await db.delete(lessonProgress).where(
      and(eq(lessonProgress.user_id, req.user.sub), eq(lessonProgress.playlist_id, playlistId))
    );
    await db.delete(courseEnrollments).where(
      and(eq(courseEnrollments.user_id, req.user.sub), eq(courseEnrollments.playlist_id, playlistId))
    );
    res.json({ status: 'success', data: { message: 'Inscripción cancelada' } });
  } catch (err) { next(err); }
});

async function checkLeccion(req, res) {
  const playlistId = Number(req.params.id);
  const videoId = Number(req.params.videoId);

  if (!await getCurso(playlistId)) {
    res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    return null;
  }
  if (!await estaInscrito(req.user.sub, playlistId)) {
    res.status(403).json({ status: 'error', message: 'Debes inscribirte en el curso primero' });
    return null;
  }
  const [pertenece] = await db.select({ video_id: profesorPlaylistVideos.video_id })
    .from(profesorPlaylistVideos)
    .where(and(
      eq(profesorPlaylistVideos.playlist_id, playlistId),
      eq(profesorPlaylistVideos.video_id, videoId),
    ));
  if (!pertenece) {
    res.status(404).json({ status: 'error', message: 'La lección no pertenece a este curso' });
    return null;
  }
  return { playlistId, videoId };
}

// POST /api/cursos/:id/lecciones/:videoId/completar
router.post('/:id/lecciones/:videoId/completar', verifyToken, async (req, res, next) => {
  try {
    const ctx = await checkLeccion(req, res);
    if (!ctx) return;

    await db.insert(lessonProgress)
      .values({ user_id: req.user.sub, playlist_id: ctx.playlistId, video_id: ctx.videoId })
      .onDuplicateKeyUpdate({ set: { user_id: req.user.sub } });
    const { porcentaje } = await getProgreso(req.user.sub, ctx.playlistId);
    res.json({ status: 'success', data: { porcentaje } });
  } catch (err) { next(err); }
});

// DELETE /api/cursos/:id/lecciones/:videoId/completar
router.delete('/:id/lecciones/:videoId/completar', verifyToken, async (req, res, next) => {
  try {
    const ctx = await checkLeccion(req, res);
    if (!ctx) return;

    await db.delete(lessonProgress).where(and(
      eq(lessonProgress.user_id, req.user.sub),
      eq(lessonProgress.playlist_id, ctx.playlistId),
      eq(lessonProgress.video_id, ctx.videoId),
    ));
    const { porcentaje } = await getProgreso(req.user.sub, ctx.playlistId);
    res.json({ status: 'success', data: { porcentaje } });
  } catch (err) { next(err); }
});

// GET /api/cursos/:id/reviews (pública)
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await getCurso(playlistId)) return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });

    const items = await db
      .select({
        id: courseReviews.id, user_id: courseReviews.user_id,
        nombre: users.nombre, avatar_path: users.avatar_path,
        estrellas: courseReviews.estrellas, texto: courseReviews.texto,
        created_at: courseReviews.created_at,
      })
      .from(courseReviews)
      .innerJoin(users, eq(courseReviews.user_id, users.id))
      .where(eq(courseReviews.playlist_id, playlistId))
      .orderBy(sql`${courseReviews.created_at} DESC`);

    const rating = await getRating(playlistId);
    res.json({
      status: 'success',
      data: {
        items: items.map(r => ({
          id: r.id, user_id: r.user_id, nombre: r.nombre,
          avatar_url: avatarUrl(r.avatar_path),
          estrellas: r.estrellas, texto: r.texto, created_at: r.created_at,
        })),
        promedio: rating.promedio_estrellas,
        total: rating.total_reviews,
      },
    });
  } catch (err) { next(err); }
});

// PUT /api/cursos/:id/reviews (upsert propia; requiere inscripción)
router.put('/:id/reviews', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await getCurso(playlistId)) return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });

    if (!await estaInscrito(req.user.sub, playlistId)) {
      return res.status(403).json({ status: 'error', message: 'Debes inscribirte en el curso para dejar una reseña' });
    }

    const { estrellas, texto } = z.object({
      estrellas: z.number().int().min(1).max(5),
      texto: z.string().max(5000).optional(),
    }).parse(req.body);

    await db.insert(courseReviews)
      .values({ playlist_id: playlistId, user_id: req.user.sub, estrellas, texto: texto ?? null })
      .onDuplicateKeyUpdate({ set: { estrellas, texto: texto ?? null } });

    const [review] = await db.select().from(courseReviews).where(and(
      eq(courseReviews.playlist_id, playlistId), eq(courseReviews.user_id, req.user.sub)
    ));
    res.json({ status: 'success', data: review });
  } catch (err) { next(err); }
});

// DELETE /api/cursos/:id/reviews (borra propia)
router.delete('/:id/reviews', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    await db.delete(courseReviews).where(and(
      eq(courseReviews.playlist_id, playlistId), eq(courseReviews.user_id, req.user.sub)
    ));
    res.json({ status: 'success', data: { message: 'Reseña eliminada' } });
  } catch (err) { next(err); }
});

export default router;
