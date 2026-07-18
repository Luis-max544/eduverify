import { Router } from 'express';
import { eq, sql, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { videos, users, profesorPlaylists, profesorPlaylistVideos, coursePurchases, channelSubscriptions } from '../db/schema.js';
import { verifyToken, requireRol, optionalAuth } from '../middleware/auth.js';
import { uploadThumbnail, uploadSubtitles, putToMinio, thumbKey, subsKey } from '../middleware/upload.js';
import { mediaUrl, minioClient, BUCKET } from '../config/minio.js';
import { env } from '../config/env.js';
import { v4 as uuid } from 'uuid';

const router = Router();

async function esPremiumDb(userId) {
  const [u] = await db.select({ premium: users.premium }).from(users).where(eq(users.id, userId));
  return Boolean(u?.premium);
}

const CATEGORIAS = ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

function formatVideo(v) {
  return {
    ...v,
    author_avatar_url: mediaUrl(v.author_avatar_url),
    thumbnail_url: mediaUrl(v.thumbnail_key),
  };
}

// GET /api/videos
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const categoria = req.query.categoria;

    const catWhere = categoria && CATEGORIAS.includes(categoria) ? eq(videos.categoria, categoria) : undefined;
    const fullWhere = catWhere ? and(catWhere, eq(videos.visible, true)) : eq(videos.visible, true);

    const rows = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, minio_key: videos.minio_key,
        thumbnail_key: videos.thumbnail_key, status: videos.status,
        categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, visible: videos.visible,
        vistas: videos.vistas, duracion: videos.duracion, created_at: videos.created_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(fullWhere)
      .orderBy(desc(videos.id))
      .limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(videos).where(fullWhere);

    res.json({ status: 'success', data: { items: rows.map(formatVideo), total: Number(total), page, limit } });
  } catch (err) { next(err); }
});

// GET /api/videos/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const [row] = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, minio_key: videos.minio_key,
        thumbnail_key: videos.thumbnail_key, subtitles_key: videos.subtitles_key,
        status: videos.status, categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, visible: videos.visible,
        usuario_id: videos.usuario_id, vistas: videos.vistas, duracion: videos.duracion,
        created_at: videos.created_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(videos.id, Number(req.params.id)));

    if (!row) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (!row.visible && (!req.user || req.user.sub !== row.usuario_id)) {
      return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    }
    if (row.es_premium && req.user?.sub !== row.usuario_id) {
      const premium = req.user ? await esPremiumDb(req.user.sub) : false;
      if (!premium) return res.status(403).json({ status: 'error', message: 'Contenido exclusivo para miembros Premium' });
    }
    res.json({ status: 'success', data: formatVideo(row) });
  } catch (err) { next(err); }
});

// POST /api/videos — profesor/creador only
router.post('/', verifyToken, requireRol('profesor', 'creador'), async (req, res, next) => {
  try {
    const schema = z.object({
      titulo:      z.string().min(3).max(255),
      descripcion: z.string().optional(),
      url_video:   z.string().url().optional(),
      upload:      z.boolean().default(false),
      categoria:   z.enum(['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']),
      tipo:        z.enum(['grabado', 'envivo']).default('grabado'),
      es_premium:  z.boolean().default(false),
      visible:     z.boolean().default(true),
      duracion:    z.string().optional(),
      playlist_id: z.number().int().positive(),
    });

    const data = schema.parse(req.body);

    if (!data.upload && !data.url_video) {
      return res.status(400).json({ status: 'error', message: 'Provee url_video o upload:true' });
    }

    const { playlist_id, upload, ...videoData } = data;

    const [playlist] = await db
      .select({ id: profesorPlaylists.id })
      .from(profesorPlaylists)
      .where(and(eq(profesorPlaylists.id, playlist_id), eq(profesorPlaylists.user_id, req.user.sub)));

    if (!playlist) return res.status(403).json({ status: 'error', message: 'Curso no encontrado o sin permisos' });

    const insertPayload = {
      ...videoData,
      url_video: upload ? null : videoData.url_video,
      status: upload ? 'uploading' : 'ready',
      usuario_id: req.user.sub,
    };

    let created, minioKey;
    await db.transaction(async (tx) => {
      const [result] = await tx.insert(videos).values(insertPayload);
      const videoId = result.insertId;

      if (upload) {
        minioKey = `videos/${videoId}_${uuid()}.mp4`;
        await tx.update(videos).set({ minio_key: minioKey }).where(eq(videos.id, videoId));
      }

      const [{ maxOrden }] = await tx
        .select({ maxOrden: sql`COALESCE(MAX(orden), -1)` })
        .from(profesorPlaylistVideos)
        .where(eq(profesorPlaylistVideos.playlist_id, playlist_id));

      await tx.insert(profesorPlaylistVideos).values({
        playlist_id, video_id: videoId, orden: Number(maxOrden) + 1,
      });

      [created] = await tx
        .select({
          id: videos.id, titulo: videos.titulo, categoria: videos.categoria,
          url_video: videos.url_video, minio_key: videos.minio_key,
          thumbnail_key: videos.thumbnail_key, status: videos.status,
          tipo: videos.tipo, es_premium: videos.es_premium,
          vistas: videos.vistas, duracion: videos.duracion, created_at: videos.created_at,
          autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
        })
        .from(videos)
        .innerJoin(users, eq(videos.usuario_id, users.id))
        .where(eq(videos.id, videoId));
    });

    const response = { ...formatVideo(created) };

    res.status(201).json({ status: 'success', data: response });
  } catch (err) { next(err); }
});

// POST /api/videos/:id/upload — streaming upload proxy (no body buffering)
router.post('/:id/upload', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.id);
    const [vid] = await db.select({ usuario_id: videos.usuario_id, minio_key: videos.minio_key, status: videos.status })
      .from(videos).where(eq(videos.id, videoId));

    if (!vid) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (vid.usuario_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'Sin permisos' });
    if (!vid.minio_key) return res.status(400).json({ status: 'error', message: 'Video no tiene clave MinIO' });

    const size = Number(req.headers['content-length']) || undefined;
    const contentType = req.headers['content-type'] || 'video/mp4';

    await minioClient.putObject(BUCKET, vid.minio_key, req, size, { 'Content-Type': contentType });
    await db.update(videos).set({ status: 'ready' }).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { id: videoId, status: 'ready' } });
  } catch (err) {
    await db.update(videos).set({ status: 'error' }).where(eq(videos.id, Number(req.params.id))).catch(() => {});
    next(err);
  }
});

// GET /api/videos/:id/stream — proxy with Range support + premium gate
router.get('/:id/stream', optionalAuth, async (req, res, next) => {
  try {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Fallback: token from query param (used by <video> elements that can't set headers)
    if (!req.user && req.query.token) {
      try {
        const { sub, rol, premium } = jwt.verify(req.query.token, env.jwtSecret);
        req.user = { sub, rol, premium };
      } catch { /* invalid token — leave req.user null */ }
    }

    const videoId = Number(req.params.id);
    const [vid] = await db
      .select({
        minio_key: videos.minio_key, status: videos.status,
        es_premium: videos.es_premium, usuario_id: videos.usuario_id,
        visible: videos.visible,
      })
      .from(videos).where(eq(videos.id, videoId));

    if (!vid || !vid.minio_key) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (!vid.visible && req.user?.sub !== vid.usuario_id) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (vid.status !== 'ready') return res.status(409).json({ status: 'error', message: 'Video aún en procesamiento' });

    if (vid.es_premium) {
      const uid = req.user?.sub;
      if (!uid) return res.status(401).json({ status: 'error', message: 'Autenticación requerida' });
      if (uid !== vid.usuario_id && !req.user?.premium) {
        const now = new Date();
        const [chSub] = await db
          .select({ expires_at: channelSubscriptions.expires_at })
          .from(channelSubscriptions)
          .where(and(
            eq(channelSubscriptions.subscriber_id, uid),
            eq(channelSubscriptions.professor_id, vid.usuario_id),
          ));
        const hasChSub = chSub && new Date(chSub.expires_at) > now;

        const [purchase] = await db
          .select({ id: coursePurchases.id, refunded_at: coursePurchases.refunded_at })
          .from(coursePurchases)
          .innerJoin(profesorPlaylistVideos, eq(profesorPlaylistVideos.video_id, videoId))
          .where(and(
            eq(coursePurchases.user_id, uid),
            eq(coursePurchases.playlist_id, profesorPlaylistVideos.playlist_id),
          ));
        const hasPurchase = purchase && !purchase.refunded_at;

        if (!hasChSub && !hasPurchase) {
          return res.status(403).json({ status: 'error', message: 'Acceso premium requerido' });
        }
      }
    }

    const stat = await minioClient.statObject(BUCKET, vid.minio_key);
    const size = stat.size;
    const range = req.headers.range;

    if (range) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = Number(s);
      const end = e ? Number(e) : size - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= size || start > end) {
        res.setHeader('Content-Range', `bytes */${size}`);
        return res.status(416).end();
      }
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      const stream = await minioClient.getPartialObject(BUCKET, vid.minio_key, start, chunkSize);
      stream.on('error', (err) => { console.error('[stream] pipe error (partial)', videoId, err.message); res.end(); });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });
      const stream = await minioClient.getObject(BUCKET, vid.minio_key);
      stream.on('error', (err) => { console.error('[stream] pipe error (full)', videoId, err.message); res.end(); });
      stream.pipe(res);
    }
  } catch (err) {     console.log(err);
next(err); }
});

// GET /api/videos/:id/subtitles
router.get('/:id/subtitles', optionalAuth, async (req, res, next) => {
  try {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    const [vid] = await db
      .select({ subtitles_key: videos.subtitles_key, es_premium: videos.es_premium, usuario_id: videos.usuario_id })
      .from(videos).where(eq(videos.id, Number(req.params.id)));
    if (!vid?.subtitles_key) return res.status(404).json({ status: 'error', message: 'Sin subtítulos' });
    if (vid.es_premium && req.user?.sub !== vid.usuario_id) {
      const premium = req.user ? await esPremiumDb(req.user.sub) : false;
      if (!premium) return res.status(403).json({ status: 'error', message: 'Contenido exclusivo para miembros Premium' });
    }
    const stream = await minioClient.getObject(BUCKET, vid.subtitles_key);
    res.setHeader('Content-Type', 'text/vtt');
    stream.pipe(res);
  } catch (err) { next(err); }
});

// PUT /api/videos/:id/thumbnail
router.put('/:id/thumbnail', verifyToken, (req, res, next) => {
  uploadThumbnail(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No se recibió archivo' });
    const videoId = Number(req.params.id);
    const [vid] = await db.select({ usuario_id: videos.usuario_id }).from(videos).where(eq(videos.id, videoId));
    if (!vid) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (vid.usuario_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'Sin permisos' });
    const key = thumbKey(videoId, req.file);
    await putToMinio(key, req.file.buffer, req.file.mimetype);
    await db.update(videos).set({ thumbnail_key: key }).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { thumbnail_url: mediaUrl(key) } });
  });
});

// PUT /api/videos/:id/subtitles
router.put('/:id/subtitles', verifyToken, (req, res, next) => {
  uploadSubtitles(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No se recibió archivo' });
    const videoId = Number(req.params.id);
    const [vid] = await db.select({ usuario_id: videos.usuario_id }).from(videos).where(eq(videos.id, videoId));
    if (!vid) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (vid.usuario_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'Sin permisos' });
    const key = subsKey(videoId);
    await putToMinio(key, req.file.buffer, 'text/vtt');
    await db.update(videos).set({ subtitles_key: key }).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { subtitles_url: `/api/videos/${videoId}/subtitles` } });
  });
});

// PATCH /api/videos/:id
router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.id);
    const [existing] = await db.select({ usuario_id: videos.usuario_id }).from(videos).where(eq(videos.id, videoId));
    if (!existing) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (existing.usuario_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No tienes permisos para editar este video' });

    const data = z.object({
      titulo:      z.string().min(3).max(255).optional(),
      descripcion: z.string().optional(),
      categoria:   z.enum(['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']).optional(),
      es_premium:  z.boolean().optional(),
      visible:     z.boolean().optional(),
      duracion:    z.string().optional(),
    }).parse(req.body);

    await db.update(videos).set(data).where(eq(videos.id, videoId));
    const [updated] = await db.select().from(videos).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/videos/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.id);
    const [existing] = await db.select({ usuario_id: videos.usuario_id }).from(videos).where(eq(videos.id, videoId));
    if (!existing) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (existing.usuario_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No tienes permisos para eliminar este video' });
    await db.delete(videos).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { message: 'Video eliminado' } });
  } catch (err) { next(err); }
});

// POST /api/videos/:id/view
router.post('/:id/view', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.id);
    const [vid] = await db.select({ vistas: videos.vistas, usuario_id: videos.usuario_id }).from(videos).where(eq(videos.id, videoId));
    if (!vid) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (req.user.sub === vid.usuario_id) return res.json({ status: 'success', data: { vistas: vid.vistas } });
    await db.update(videos).set({ vistas: sql`vistas + 1` }).where(eq(videos.id, videoId));
    const [{ vistas }] = await db.select({ vistas: videos.vistas }).from(videos).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { vistas } });
  } catch (err) { next(err); }
});

export default router;
