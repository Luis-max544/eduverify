import { Router } from 'express';
import { eq, and, sql, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { profesorPlaylists, profesorPlaylistVideos, videos, users, courseReviews, quizzes, quizQuestions, pdfResources } from '../db/schema.js';
import { verifyToken, requireRol } from '../middleware/auth.js';
import { uploadPdf, uploadCover, putToMinio, coverKey, pdfKey } from '../middleware/upload.js';
import { mediaUrl } from '../config/minio.js';

const router = Router();

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
        minio_key: videos.minio_key, status: videos.status,
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
      portada_url: mediaUrl(pl.portada_path),
      promedio_estrellas: rating ? Number(Number(rating.promedio).toFixed(1)) : null,
      total_reviews: rating ? Number(rating.total) : 0,
      videos: rows.map(v => ({
        ...v,
        author_avatar_url: mediaUrl(v.author_avatar_url),
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
    const data = z.object({
      nombre:      z.string().min(1).max(255),
      descripcion: z.string().max(5000).optional(),
      categoria:   z.enum(['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']).optional(),
      es_premium:  z.boolean().default(false),
      precio:      z.number().positive().nullable().optional(),
    }).parse(req.body);

    if (data.precio && !req.user.membresia_docente) {
      return res.status(403).json({ status: 'error', message: 'Necesitas Membresía Docente para asignar precio a un curso' });
    }
    const [result] = await db.insert(profesorPlaylists).values({ user_id: req.user.sub, ...data });
    const [created] = await db.select().from(profesorPlaylists).where(eq(profesorPlaylists.id, result.insertId));
    res.status(201).json({ status: 'success', data: { ...created, portada_url: null, videos: [] } });
  } catch (err) { next(err); }
});

// PATCH /api/profesor/playlists/:id
router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const cambios = z.object({
      nombre:      z.string().min(1).max(255).optional(),
      descripcion: z.string().max(5000).nullable().optional(),
      categoria:   z.enum(['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']).optional(),
      es_premium:  z.boolean().optional(),
      precio:      z.number().positive().nullable().optional(),
    }).refine(o => Object.values(o).some(v => v !== undefined), {
      message: 'Se requiere al menos un campo',
    }).parse(req.body);

    if (cambios.precio && !req.user.membresia_docente) {
      return res.status(403).json({ status: 'error', message: 'Necesitas Membresía Docente para asignar precio a un curso' });
    }

    await db.update(profesorPlaylists).set(cambios).where(eq(profesorPlaylists.id, playlistId));
    const [updated] = await db.select().from(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
    res.json({ status: 'success', data: updated });
  } catch (err) { next(err); }
});

// PUT /api/profesor/playlists/:id/cover — subir portada del curso
router.put('/:id/cover', verifyToken, (req, res, next) => {
  const playlistId = Number(req.params.id);
  uploadCover(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No se recibió archivo' });
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;
    const key = coverKey(playlistId, req.file);
    await putToMinio(key, req.file.buffer, req.file.mimetype);
    await db.update(profesorPlaylists).set({ portada_path: key }).where(eq(profesorPlaylists.id, playlistId));
    res.json({ status: 'success', data: { portada_url: mediaUrl(key) } });
  });
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
    // El quiz de la lección queda huérfano al sacar el video de la playlist — se borra aquí
    await db.delete(quizzes).where(
      and(eq(quizzes.playlist_id, playlistId), eq(quizzes.video_id, videoId))
    );
    res.json({ status: 'success', data: { message: 'Video eliminado' } });
  } catch (err) { next(err); }
});

// ─── QUIZZES (owner) ─────────────────────────────────────────────────────────

const preguntaSchema = z.object({
  pregunta: z.string().min(1).max(2000),
  opciones: z.array(z.string().min(1).max(500)).min(2).max(6),
  correcta: z.number().int().min(0),
}).refine(p => p.correcta < p.opciones.length, { message: 'correcta fuera de rango' });

async function getQuizConPreguntas(quizId) {
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
  if (!quiz) return null;
  const preguntas = await db
    .select({
      id: quizQuestions.id, pregunta: quizQuestions.pregunta,
      opciones: quizQuestions.opciones, correcta: quizQuestions.correcta,
      orden: quizQuestions.orden,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.quiz_id, quizId))
    .orderBy(quizQuestions.orden);
  return { ...quiz, preguntas };
}

// GET /api/profesor/playlists/:id/quizzes — todos los quizzes del curso, con respuestas (owner)
router.get('/:id/quizzes', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const qs = await db.select().from(quizzes).where(eq(quizzes.playlist_id, playlistId));
    const data = await Promise.all(qs.map(q => getQuizConPreguntas(q.id)));
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

// PUT /api/profesor/playlists/:id/quiz — crea/reemplaza el quiz de una lección o el examen final (video_id null)
router.put('/:id/quiz', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const { video_id, titulo, min_aprobacion, preguntas } = z.object({
      video_id: z.number().int().positive().nullable(),
      titulo: z.string().max(255).nullable().optional(),
      min_aprobacion: z.number().int().min(1).max(100).default(70),
      preguntas: z.array(preguntaSchema).min(1).max(50),
    }).parse(req.body);

    if (video_id !== null) {
      const [pertenece] = await db.select({ video_id: profesorPlaylistVideos.video_id })
        .from(profesorPlaylistVideos)
        .where(and(eq(profesorPlaylistVideos.playlist_id, playlistId), eq(profesorPlaylistVideos.video_id, video_id)));
      if (!pertenece) {
        return res.status(400).json({ status: 'error', message: 'El video no pertenece a este curso' });
      }
    }

    // select-then-update: el unique de MySQL no deduplica video_id NULL (examen final)
    const [existente] = await db.select({ id: quizzes.id }).from(quizzes).where(and(
      eq(quizzes.playlist_id, playlistId),
      video_id === null ? isNull(quizzes.video_id) : eq(quizzes.video_id, video_id),
    ));

    let quizId;
    if (existente) {
      quizId = existente.id;
      await db.update(quizzes).set({ titulo: titulo ?? null, min_aprobacion }).where(eq(quizzes.id, quizId));
      await db.delete(quizQuestions).where(eq(quizQuestions.quiz_id, quizId));
    } else {
      const [result] = await db.insert(quizzes).values({
        playlist_id: playlistId, video_id, titulo: titulo ?? null, min_aprobacion,
      });
      quizId = result.insertId;
    }

    await db.insert(quizQuestions).values(preguntas.map((p, i) => ({
      quiz_id: quizId, pregunta: p.pregunta, opciones: p.opciones, correcta: p.correcta, orden: i,
    })));

    res.json({ status: 'success', data: await getQuizConPreguntas(quizId) });
  } catch (err) { next(err); }
});

// DELETE /api/profesor/playlists/:id/quizzes/:quizId
router.delete('/:id/quizzes/:quizId', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const quizId = Number(req.params.quizId);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const [quiz] = await db.select({ id: quizzes.id }).from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.playlist_id, playlistId)));
    if (!quiz) return res.status(404).json({ status: 'error', message: 'Quiz no encontrado en este curso' });

    await db.delete(quizzes).where(eq(quizzes.id, quizId));
    res.json({ status: 'success', data: { message: 'Quiz eliminado' } });
  } catch (err) { next(err); }
});

// ─── PDF RESOURCES (owner only) ─────────────────────────────────────────────

// GET /api/profesor/playlists/:id/pdfs — lista PDFs del curso (owner)
router.get('/:id/pdfs', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;
    const items = await db.select().from(pdfResources).where(eq(pdfResources.playlist_id, playlistId));
    res.json({ status: 'success', data: items });
  } catch (err) { next(err); }
});

// PUT /api/profesor/playlists/:id/pdf — crea/reemplaza PDF (multipart)
router.put('/:id/pdf', verifyToken, (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    try {
      const playlistId = Number(req.params.id);
      if (!await ownerCheck(playlistId, req.user.sub, res)) return;

      const videoId = req.body.video_id ? Number(req.body.video_id) : null;
      const file = req.file;
      if (!file) return res.status(400).json({ status: 'error', message: 'Archivo PDF requerido' });

      // Buscar existente y borrar archivo viejo en disco
      const conditions = [eq(pdfResources.playlist_id, playlistId)];
      if (videoId !== null) conditions.push(eq(pdfResources.video_id, videoId));
      else conditions.push(sql`${pdfResources.video_id} IS NULL`);

      const [existing] = await db.select().from(pdfResources).where(and(...conditions));
      if (existing) {
        await db.delete(pdfResources).where(eq(pdfResources.id, existing.id));
      }

      const key = pdfKey(file);
      await putToMinio(key, file.buffer, file.mimetype);

      await db.insert(pdfResources).values({
        playlist_id: playlistId,
        video_id: videoId,
        filename: key,
        original_name: file.originalname,
      });

      const [created] = await db.select().from(pdfResources).where(and(
        eq(pdfResources.playlist_id, playlistId),
        videoId !== null ? eq(pdfResources.video_id, videoId) : sql`${pdfResources.video_id} IS NULL`
      ));

      res.status(201).json({ status: 'success', data: created });
    } catch (e) { next(e); }
  });
});

// DELETE /api/profesor/playlists/:id/pdfs/:pdfId
router.delete('/:id/pdfs/:pdfId', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const pdfId = Number(req.params.pdfId);
    if (!await ownerCheck(playlistId, req.user.sub, res)) return;

    const [row] = await db.select().from(pdfResources).where(and(
      eq(pdfResources.id, pdfId),
      eq(pdfResources.playlist_id, playlistId),
    ));
    if (!row) return res.status(404).json({ status: 'error', message: 'PDF no encontrado' });

    await db.delete(pdfResources).where(eq(pdfResources.id, pdfId));
    res.json({ status: 'success', data: { message: 'PDF eliminado' } });
  } catch (err) { next(err); }
});

export default router;
