import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { notifications } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, req.user.sub))
      .orderBy(desc(notifications.created_at))
      .limit(limit);
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', verifyToken, async (req, res, next) => {
  try {
    await db.update(notifications).set({ leida: true }).where(eq(notifications.user_id, req.user.sub));
    res.json({ status: 'success', data: { message: 'Todas las notificaciones marcadas como leídas' } });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const notifId = Number(req.params.id);
    await db.update(notifications)
      .set({ leida: true })
      .where(and(eq(notifications.id, notifId), eq(notifications.user_id, req.user.sub)));
    res.json({ status: 'success', data: { message: 'Notificación marcada como leída' } });
  } catch (err) { next(err); }
});

export default router;
