import { Router } from 'express';
import { eq, sql, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { users, videos, subscriptions, channelSubscriptions } from '../db/schema.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { uploadAvatar, uploadBanner, putToMinio, avatarKey, bannerKey } from '../middleware/upload.js';
import { mediaUrl } from '../config/minio.js';

const router = Router();

function formatUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    tier: user.tier,
    premium: user.premium,
    membresia_docente: user.membresia_docente,
    membresia_docente_expires_at: user.membresia_docente_expires_at,
    canal_precio: user.canal_precio ? Number(user.canal_precio) : null,
    dark_mode: user.dark_mode,
    avatar_url: mediaUrl(user.avatar_path),
    banner_url: mediaUrl(user.banner_path),
  };
}

// GET /api/users/me
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.sub));
    if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    res.json({ status: 'success', data: formatUser(user) });
  } catch (err) { next(err); }
});

// PATCH /api/users/me
router.patch('/me', verifyToken, async (req, res, next) => {
  try {
    const { nombre } = z.object({
      nombre: z.string().min(2).max(120).optional(),
    }).parse(req.body);

    if (!nombre) return res.status(400).json({ status: 'error', message: 'Nada que actualizar' });

    await db.update(users).set({ nombre }).where(eq(users.id, req.user.sub));
    const [updated] = await db.select().from(users).where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: formatUser(updated) });
  } catch (err) { next(err); }
});

// PATCH /api/users/me/dark-mode
router.patch('/me/dark-mode', verifyToken, async (req, res, next) => {
  try {
    const { dark_mode } = z.object({ dark_mode: z.boolean() }).parse(req.body);
    await db.update(users).set({ dark_mode }).where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { dark_mode } });
  } catch (err) { next(err); }
});

// POST /api/users/me/avatar
router.post('/me/avatar', verifyToken, (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No se recibió archivo' });

    const key = avatarKey(req.user.sub, req.file);
    await putToMinio(key, req.file.buffer, req.file.mimetype);
    await db.update(users).set({ avatar_path: key }).where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { avatar_url: mediaUrl(key) } });
  });
});

// POST /api/users/me/banner
router.post('/me/banner', verifyToken, (req, res, next) => {
  uploadBanner(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No se recibió archivo' });

    const key = bannerKey(req.user.sub, req.file);
    await putToMinio(key, req.file.buffer, req.file.mimetype);
    await db.update(users).set({ banner_path: key }).where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { banner_url: mediaUrl(key) } });
  });
});

// PATCH /api/users/me/canal-precio
router.patch('/me/canal-precio', verifyToken, async (req, res, next) => {
  try {
    const rol = req.user.rol;
    if (rol !== 'profesor' && rol !== 'creador') {
      return res.status(403).json({ status: 'error', message: 'Solo disponible para docentes' });
    }

    const { canal_precio } = z.object({
      canal_precio: z.number().positive().nullable(),
    }).parse(req.body);

    // Require ≥ 100 subscribers unless creador (verified channels exempt)
    if (rol !== 'creador') {
      const [{ count }] = await db
        .select({ count: sql`COUNT(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.professor_id, req.user.sub));
      if (Number(count) < 100) {
        return res.status(403).json({ status: 'error', message: 'Necesitas al menos 100 suscriptores para activar el precio de canal' });
      }
    }

    await db.update(users).set({ canal_precio }).where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { canal_precio } });
  } catch (err) { next(err); }
});

// GET /api/users/:id/profile
router.get('/:id/profile', optionalAuth, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });

    const isOwner = req.user?.sub === userId;
    const vidWhere = isOwner ? eq(videos.usuario_id, userId) : and(eq(videos.usuario_id, userId), eq(videos.visible, true));

    const [{ count: videoCount }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(videos)
      .where(vidWhere);

    const [{ count: subCount }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.professor_id, userId));

    res.json({
      status: 'success',
      data: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        canal_precio: user.canal_precio ? Number(user.canal_precio) : null,
        avatar_url: mediaUrl(user.avatar_path),
        banner_url: mediaUrl(user.banner_path),
        video_count: Number(videoCount),
        subscriber_count: Number(subCount),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/users/:id/videos
router.get('/:id/videos', optionalAuth, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const isOwner = req.user?.sub === userId;
    const baseWhere = isOwner ? eq(videos.usuario_id, userId) : and(eq(videos.usuario_id, userId), eq(videos.visible, true));

    const rows = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, minio_key: videos.minio_key, status: videos.status,
        categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, visible: videos.visible,
        vistas: videos.vistas, duracion: videos.duracion,
        created_at: videos.created_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(baseWhere)
      .orderBy(desc(videos.id))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`COUNT(*)` })
      .from(videos)
      .where(baseWhere);

    const items = rows.map(v => ({ ...v, author_avatar_url: mediaUrl(v.author_avatar_url) }));

    res.json({ status: 'success', data: { items, total: Number(total), page, limit } });
  } catch (err) { next(err); }
});

export default router;
