import { Router } from 'express';
import { eq, and, sql, inArray, gt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import {
  profesorPlaylists, profesorPlaylistVideos, videos, users,
  courseEnrollments, lessonProgress, courseReviews,
  quizzes, quizQuestions, quizAttempts,
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

// ─── QUIZZES: constantes y helpers ───────────────────────────────────────────

// Reintentos para usuarios free (premium = ilimitados). Rate-limit por ventana deslizante.
const FREE_QUIZ_MAX_ATTEMPTS = 3;
const FREE_QUIZ_WINDOW_MS = 30 * 60 * 1000; // recarga: 30 min

async function getQuizzesCurso(playlistId) {
  const qs = await db
    .select({
      id: quizzes.id, video_id: quizzes.video_id,
      titulo: quizzes.titulo, min_aprobacion: quizzes.min_aprobacion,
    })
    .from(quizzes)
    .where(eq(quizzes.playlist_id, playlistId));

  const counts = qs.length
    ? await db
        .select({ quiz_id: quizQuestions.quiz_id, total: sql`COUNT(*)` })
        .from(quizQuestions)
        .where(inArray(quizQuestions.quiz_id, qs.map(q => q.id)))
        .groupBy(quizQuestions.quiz_id)
    : [];
  const countBy = new Map(counts.map(c => [c.quiz_id, Number(c.total)]));
  return qs.map(q => ({ ...q, num_preguntas: countBy.get(q.id) || 0 }));
}

async function quizzesAprobados(userId, playlistId) {
  const rows = await db
    .select({ quiz_id: quizAttempts.quiz_id })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quiz_id, quizzes.id))
    .where(and(
      eq(quizAttempts.user_id, userId),
      eq(quizzes.playlist_id, playlistId),
      eq(quizAttempts.passed, true),
    ));
  return [...new Set(rows.map(r => r.quiz_id))];
}

// Gating secuencial: ¿hay lecciones con orden anterior sin completar?
async function previasIncompletas(userId, playlistId, videoId) {
  const lecciones = await db
    .select({ video_id: profesorPlaylistVideos.video_id })
    .from(profesorPlaylistVideos)
    .where(eq(profesorPlaylistVideos.playlist_id, playlistId))
    .orderBy(profesorPlaylistVideos.orden);
  const idx = lecciones.findIndex(l => l.video_id === videoId);
  if (idx <= 0) return false;

  const { completadas } = await getProgreso(userId, playlistId);
  const set = new Set(completadas);
  return lecciones.slice(0, idx).some(l => !set.has(l.video_id));
}

// Invariante secuencial en reversa: ¿hay lecciones posteriores ya completadas?
async function posterioresCompletadas(userId, playlistId, videoId) {
  const lecciones = await db
    .select({ video_id: profesorPlaylistVideos.video_id })
    .from(profesorPlaylistVideos)
    .where(eq(profesorPlaylistVideos.playlist_id, playlistId))
    .orderBy(profesorPlaylistVideos.orden);
  const idx = lecciones.findIndex(l => l.video_id === videoId);
  if (idx < 0) return false;

  const { completadas } = await getProgreso(userId, playlistId);
  const set = new Set(completadas);
  return lecciones.slice(idx + 1).some(l => set.has(l.video_id));
}

// premium fresco de DB: el JWT no se reemite al activar premium (req.user.premium queda obsoleto)
async function esPremiumDb(userId) {
  const [u] = await db.select({ premium: users.premium }).from(users).where(eq(users.id, userId));
  return Boolean(u?.premium);
}

async function estadoIntentos(userId, quizId, premium) {
  if (premium) return { intentos_usados: 0, intentos_restantes: null, cooldown_hasta: null };

  const desde = new Date(Date.now() - FREE_QUIZ_WINDOW_MS);
  const recientes = await db
    .select({ created_at: quizAttempts.created_at })
    .from(quizAttempts)
    .where(and(
      eq(quizAttempts.quiz_id, quizId),
      eq(quizAttempts.user_id, userId),
      gt(quizAttempts.created_at, desde),
    ))
    .orderBy(quizAttempts.created_at);

  const intentos_usados = recientes.length;
  const intentos_restantes = Math.max(0, FREE_QUIZ_MAX_ATTEMPTS - intentos_usados);
  const cooldown_hasta = intentos_restantes === 0
    ? new Date(new Date(recientes[0].created_at).getTime() + FREE_QUIZ_WINDOW_MS).toISOString()
    : null;
  return { intentos_usados, intentos_restantes, cooldown_hasta };
}

// null si el quiz está desbloqueado; mensaje de error si no
async function quizBloqueado(userId, playlistId, quiz) {
  if (quiz.video_id !== null) {
    return await previasIncompletas(userId, playlistId, quiz.video_id)
      ? 'Debes completar las lecciones anteriores primero'
      : null;
  }
  const { porcentaje } = await getProgreso(userId, playlistId);
  return porcentaje < 100 ? 'Completa todas las lecciones para desbloquear el examen final' : null;
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

    // Ruta pública: solo metadatos de quiz (nunca preguntas ni respuestas)
    const quizzesCurso = await getQuizzesCurso(playlistId);
    const quizPorVideo = new Map(quizzesCurso.filter(q => q.video_id !== null).map(q => [q.video_id, q.id]));
    const final = quizzesCurso.find(q => q.video_id === null) || null;

    res.json({
      status: 'success',
      data: {
        id: pl.id,
        nombre: pl.nombre,
        descripcion: pl.descripcion,
        created_at: pl.created_at,
        autor: { id: autor.id, nombre: autor.nombre, avatar_url: avatarUrl(autor.avatar_path) },
        lecciones: lecciones.map(l => ({
          ...l,
          author_avatar_url: avatarUrl(l.author_avatar_url),
          quiz_id: quizPorVideo.get(l.id) ?? null,
        })),
        total_lecciones: lecciones.length,
        inscritos: Number(inscritosRow?.total || 0),
        quiz_final: final
          ? { id: final.id, titulo: final.titulo, min_aprobacion: final.min_aprobacion, num_preguntas: final.num_preguntas }
          : null,
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
    const quizzes_aprobados = await quizzesAprobados(req.user.sub, playlistId);
    res.json({ status: 'success', data: { inscrito, completadas, porcentaje, quizzes_aprobados } });
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

    // Gating secuencial estricto
    if (await previasIncompletas(req.user.sub, ctx.playlistId, ctx.videoId)) {
      return res.status(403).json({ status: 'error', message: 'Debes completar las lecciones anteriores primero' });
    }

    // Si la lección tiene quiz, hay que aprobarlo (el intento aprobado completa la lección solo)
    const [quizLeccion] = await db.select({ id: quizzes.id }).from(quizzes)
      .where(and(eq(quizzes.playlist_id, ctx.playlistId), eq(quizzes.video_id, ctx.videoId)));
    if (quizLeccion) {
      const [aprobado] = await db.select({ id: quizAttempts.id }).from(quizAttempts)
        .where(and(
          eq(quizAttempts.quiz_id, quizLeccion.id),
          eq(quizAttempts.user_id, req.user.sub),
          eq(quizAttempts.passed, true),
        ));
      if (!aprobado) {
        return res.status(403).json({ status: 'error', message: 'Debes aprobar el quiz de esta lección para completarla' });
      }
    }

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

    // Preserva el invariante secuencial: no desmarcar si hay lecciones posteriores completadas
    if (await posterioresCompletadas(req.user.sub, ctx.playlistId, ctx.videoId)) {
      return res.status(403).json({ status: 'error', message: 'No puedes desmarcar esta lección: ya completaste lecciones posteriores' });
    }

    await db.delete(lessonProgress).where(and(
      eq(lessonProgress.user_id, req.user.sub),
      eq(lessonProgress.playlist_id, ctx.playlistId),
      eq(lessonProgress.video_id, ctx.videoId),
    ));
    const { porcentaje } = await getProgreso(req.user.sub, ctx.playlistId);
    res.json({ status: 'success', data: { porcentaje } });
  } catch (err) { next(err); }
});

// ─── QUIZZES (estudiante) ────────────────────────────────────────────────────

async function checkQuiz(req, res) {
  const playlistId = Number(req.params.id);
  const quizId = Number(req.params.quizId);

  if (!await getCurso(playlistId)) {
    res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    return null;
  }
  if (!await estaInscrito(req.user.sub, playlistId)) {
    res.status(403).json({ status: 'error', message: 'Debes inscribirte en el curso primero' });
    return null;
  }
  const [quiz] = await db.select().from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.playlist_id, playlistId)));
  if (!quiz) {
    res.status(404).json({ status: 'error', message: 'Quiz no encontrado en este curso' });
    return null;
  }
  const bloqueado = await quizBloqueado(req.user.sub, playlistId, quiz);
  if (bloqueado) {
    res.status(403).json({ status: 'error', message: bloqueado });
    return null;
  }
  return { playlistId, quiz };
}

// GET /api/cursos/:id/quizzes/:quizId — preguntas SIN respuestas + estado de intentos
router.get('/:id/quizzes/:quizId', verifyToken, async (req, res, next) => {
  try {
    const ctx = await checkQuiz(req, res);
    if (!ctx) return;
    const { quiz } = ctx;

    // Columnas explícitas: `correcta` jamás sale por rutas de estudiante
    const preguntas = await db
      .select({
        id: quizQuestions.id, pregunta: quizQuestions.pregunta,
        opciones: quizQuestions.opciones, orden: quizQuestions.orden,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quiz_id, quiz.id))
      .orderBy(quizQuestions.orden);

    const premium = await esPremiumDb(req.user.sub);
    const intentos = await estadoIntentos(req.user.sub, quiz.id, premium);

    const [mejor] = await db
      .select({ mejor: sql`MAX(${quizAttempts.score})`, aprobado: sql`MAX(${quizAttempts.passed})` })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quiz_id, quiz.id), eq(quizAttempts.user_id, req.user.sub)));

    res.json({
      status: 'success',
      data: {
        id: quiz.id,
        video_id: quiz.video_id,
        titulo: quiz.titulo,
        min_aprobacion: quiz.min_aprobacion,
        preguntas,
        estado: {
          aprobado: Boolean(Number(mejor?.aprobado || 0)),
          mejor_score: mejor?.mejor != null ? Number(mejor.mejor) : null,
          ...intentos,
        },
      },
    });
  } catch (err) { next(err); }
});

// POST /api/cursos/:id/quizzes/:quizId/intento — califica server-side
router.post('/:id/quizzes/:quizId/intento', verifyToken, async (req, res, next) => {
  try {
    const ctx = await checkQuiz(req, res);
    if (!ctx) return;
    const { playlistId, quiz } = ctx;
    const userId = req.user.sub;

    const premium = await esPremiumDb(userId);
    const intentosPrevios = await estadoIntentos(userId, quiz.id, premium);
    if (!premium && intentosPrevios.intentos_restantes === 0) {
      const minutos = Math.max(1, Math.ceil((new Date(intentosPrevios.cooldown_hasta) - Date.now()) / 60000));
      return res.status(429).json({
        status: 'error',
        message: `Límite de intentos alcanzado. Vuelve a intentarlo en ${minutos} min.`,
      });
    }

    const { respuestas } = z.object({
      respuestas: z.record(z.string().regex(/^\d+$/), z.number().int().min(0)),
    }).parse(req.body);

    const preguntas = await db
      .select({ id: quizQuestions.id, opciones: quizQuestions.opciones, correcta: quizQuestions.correcta })
      .from(quizQuestions)
      .where(eq(quizQuestions.quiz_id, quiz.id));

    const ids = new Set(preguntas.map(p => String(p.id)));
    const keys = Object.keys(respuestas);
    const valido = keys.length === preguntas.length
      && keys.every(k => ids.has(k))
      && preguntas.every(p => {
        const r = respuestas[String(p.id)];
        return r !== undefined && r < p.opciones.length;
      });
    if (!valido) {
      return res.status(400).json({ status: 'error', message: 'Debes responder todas las preguntas del quiz' });
    }

    const falladas = preguntas.filter(p => respuestas[String(p.id)] !== p.correcta).map(p => p.id);
    const total = preguntas.length;
    const correctas = total - falladas.length;
    const score = Math.round((correctas / total) * 100);
    const passed = score >= quiz.min_aprobacion;

    await db.insert(quizAttempts).values({
      quiz_id: quiz.id, user_id: userId, correctas, total, score, passed, respuestas,
    });

    let porcentaje;
    if (passed && quiz.video_id !== null) {
      // Aprobar el quiz completa la lección automáticamente
      await db.insert(lessonProgress)
        .values({ user_id: userId, playlist_id: playlistId, video_id: quiz.video_id })
        .onDuplicateKeyUpdate({ set: { user_id: userId } });
      ({ porcentaje } = await getProgreso(userId, playlistId));
    }

    const intentos = await estadoIntentos(userId, quiz.id, premium);
    res.json({
      status: 'success',
      data: {
        passed, score, correctas, total,
        min_aprobacion: quiz.min_aprobacion,
        ...(porcentaje !== undefined && { porcentaje }),
        intentos_restantes: intentos.intentos_restantes,
        cooldown_hasta: intentos.cooldown_hasta,
        // Solo premium ve QUÉ preguntas falló (nunca la respuesta correcta)
        ...(premium && { falladas }),
      },
    });
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
