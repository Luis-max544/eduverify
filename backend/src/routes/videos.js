import { Router } from 'express';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { videos, users } from '../db/schema.js';
import { verifyToken, requireRol } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

const CATEGORIAS = ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

function base() { return `http://localhost:${env.port}`; }

function formatVideo(v) {
  return {
    ...v,
    author_avatar_url: v.author_avatar_url ? `${base()}/uploads/${v.author_avatar_url}` : null,
  };
}

// GET /api/videos
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const categoria = req.query.categoria;

    const where = categoria && CATEGORIAS.includes(categoria)
      ? eq(videos.categoria, categoria)
      : undefined;

    const rows = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, vistas: videos.vistas, duracion: videos.duracion,
        created_at: videos.created_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(where)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`COUNT(*)` })
      .from(videos)
      .where(where);

    res.json({
      status: 'success',
      data: { items: rows.map(formatVideo), total: Number(total), page, limit },
    });
  } catch (err) { next(err); }
});

// GET /api/videos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [row] = await db
      .select({
        id: videos.id, titulo: videos.titulo, descripcion: videos.descripcion,
        url_video: videos.url_video, categoria: videos.categoria, tipo: videos.tipo,
        es_premium: videos.es_premium, vistas: videos.vistas, duracion: videos.duracion,
        created_at: videos.created_at,
        autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path,
      })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(videos.id, Number(req.params.id)));

    if (!row) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    res.json({ status: 'success', data: formatVideo(row) });
  } catch (err) { next(err); }
});

// POST /api/videos — profesor/creador only
router.post('/', verifyToken, requireRol('profesor', 'creador'), async (req, res, next) => {
  try {
    const data = z.object({
      titulo: z.string().min(3).max(255),
      descripcion: z.string().optional(),
      url_video: z.string().url(),
      categoria: z.enum(['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']),
      tipo: z.enum(['grabado', 'envivo']).default('grabado'),
      es_premium: z.boolean().default(false),
      duracion: z.string().optional(),
    }).parse(req.body);

    const [result] = await db.insert(videos).values({ ...data, usuario_id: req.user.sub });
    const [created] = await db
      .select({ id: videos.id, titulo: videos.titulo, categoria: videos.categoria,
                 url_video: videos.url_video, tipo: videos.tipo, es_premium: videos.es_premium,
                 vistas: videos.vistas, duracion: videos.duracion, created_at: videos.created_at,
                 autor: users.nombre, autor_id: users.id, author_avatar_url: users.avatar_path })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(videos.id, result.insertId));

    res.status(201).json({ status: 'success', data: formatVideo(created) });
  } catch (err) { next(err); }
});

// PATCH /api/videos/:id
router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.id);
    const [existing] = await db.select({ usuario_id: videos.usuario_id }).from(videos).where(eq(videos.id, videoId));
    if (!existing) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });
    if (existing.usuario_id !== req.user.sub) {
      return res.status(403).json({ status: 'error', message: 'No tienes permisos para editar este video' });
    }

    const data = z.object({
      titulo: z.string().min(3).max(255).optional(),
      descripcion: z.string().optional(),
      categoria: z.enum(['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']).optional(),
      es_premium: z.boolean().optional(),
      duracion: z.string().optional(),
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
    if (existing.usuario_id !== req.user.sub) {
      return res.status(403).json({ status: 'error', message: 'No tienes permisos para eliminar este video' });
    }

    await db.delete(videos).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { message: 'Video eliminado' } });
  } catch (err) { next(err); }
});

// POST /api/videos/:id/view
router.post('/:id/view', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.id);
    await db.update(videos).set({ vistas: sql`vistas + 1` }).where(eq(videos.id, videoId));
    const [{ vistas }] = await db.select({ vistas: videos.vistas }).from(videos).where(eq(videos.id, videoId));
    res.json({ status: 'success', data: { vistas } });
  } catch (err) { next(err); }
});

export default router;
