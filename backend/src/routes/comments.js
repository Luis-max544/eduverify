import { Router } from 'express';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { comments, commentLikes, users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { mediaUrl } from '../config/minio.js';

const router = Router({ mergeParams: true });

// GET /api/videos/:videoId/comments
router.get('/', async (req, res, next) => {
  try {
    const videoId = Number(req.params.videoId);
    const userId = req.user?.sub || null;

    const allComments = await db
      .select({
        id: comments.id, video_id: comments.video_id, user_id: comments.user_id,
        parent_id: comments.parent_id, texto: comments.texto, likes: comments.likes,
        created_at: comments.created_at,
        autor: users.nombre, rol: users.rol, autor_avatar: users.avatar_path,
      })
      .from(comments)
      .innerJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.video_id, videoId));

    let likedSet = new Set();
    if (userId) {
      const liked = await db
        .select({ comment_id: commentLikes.comment_id })
        .from(commentLikes)
        .where(eq(commentLikes.user_id, userId));
      likedSet = new Set(liked.map(l => l.comment_id));
    }

    const formatted = allComments.map(c => ({
      ...c,
      autor_avatar_url: mediaUrl(c.autor_avatar),
      liked: likedSet.has(c.id),
      respuestas: [],
    }));

    const roots = formatted.filter(c => c.parent_id === null);
    const replies = formatted.filter(c => c.parent_id !== null);

    roots.forEach(root => {
      root.respuestas = replies.filter(r => r.parent_id === root.id);
    });

    res.json({ status: 'success', data: roots });
  } catch (err) { next(err); }
});

// POST /api/videos/:videoId/comments
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const videoId = Number(req.params.videoId);
    const { texto, parent_id } = z.object({
      texto: z.string().min(1).max(2000),
      parent_id: z.number().int().positive().nullable().default(null),
    }).parse(req.body);

    const [result] = await db.insert(comments).values({
      video_id: videoId,
      user_id: req.user.sub,
      parent_id: parent_id || null,
      texto,
    });

    const [created] = await db
      .select({
        id: comments.id, video_id: comments.video_id, user_id: comments.user_id,
        parent_id: comments.parent_id, texto: comments.texto, likes: comments.likes,
        created_at: comments.created_at,
        autor: users.nombre, rol: users.rol, autor_avatar: users.avatar_path,
      })
      .from(comments)
      .innerJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.id, result.insertId));

    res.status(201).json({
      status: 'success',
      data: { ...created, autor_avatar_url: mediaUrl(created.autor_avatar), liked: false, respuestas: [] },
    });
  } catch (err) { next(err); }
});

// POST /api/comments/:id/like
router.post('/:id/like', verifyToken, async (req, res, next) => {
  try {
    const commentId = Number(req.params.id);
    const userId = req.user.sub;

    const [existing] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.comment_id, commentId), eq(commentLikes.user_id, userId)));

    if (existing) {
      await db.delete(commentLikes).where(
        and(eq(commentLikes.comment_id, commentId), eq(commentLikes.user_id, userId))
      );
      await db.update(comments).set({ likes: sql`likes - 1` }).where(eq(comments.id, commentId));
    } else {
      await db.insert(commentLikes).values({ comment_id: commentId, user_id: userId });
      await db.update(comments).set({ likes: sql`likes + 1` }).where(eq(comments.id, commentId));
    }

    const [{ likes }] = await db.select({ likes: comments.likes }).from(comments).where(eq(comments.id, commentId));
    res.json({ status: 'success', data: { likes, liked: !existing } });
  } catch (err) { next(err); }
});

// DELETE /api/comments/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const commentId = Number(req.params.id);
    const [existing] = await db.select({ user_id: comments.user_id }).from(comments).where(eq(comments.id, commentId));
    if (!existing) return res.status(404).json({ status: 'error', message: 'Comentario no encontrado' });
    if (existing.user_id !== req.user.sub) {
      return res.status(403).json({ status: 'error', message: 'No tienes permisos para eliminar este comentario' });
    }

    await db.delete(comments).where(eq(comments.id, commentId));
    res.json({ status: 'success', data: { message: 'Comentario eliminado' } });
  } catch (err) { next(err); }
});

export default router;
