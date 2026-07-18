import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { subscriptions, notifications, users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

// GET /api/subscriptions
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        professor_id: subscriptions.professor_id,
        notificaciones: subscriptions.notificaciones,
        nombre: users.nombre,
        avatar_path: users.avatar_path,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.professor_id, users.id))
      .where(eq(subscriptions.subscriber_id, req.user.sub));

    const base = `http://localhost:${env.port}`;
    const data = rows.map(r => ({
      professor_id: r.professor_id,
      nombre: r.nombre,
      notificaciones: r.notificaciones,
      avatar_url: r.avatar_path ? `${base}/uploads/${r.avatar_path}` : null,
    }));

    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

// POST /api/subscriptions/:professorId
router.post('/:professorId', verifyToken, async (req, res, next) => {
  try {
    const professorId = Number(req.params.professorId);
    if (professorId === req.user.sub) {
      return res.status(400).json({ status: 'error', message: 'No puedes suscribirte a ti mismo' });
    }

    const [prof] = await db.select({ nombre: users.nombre }).from(users).where(eq(users.id, professorId));
    if (!prof) return res.status(404).json({ status: 'error', message: 'Profesor no encontrado' });

    const { notificaciones } = z.object({ notificaciones: z.boolean().default(true) }).parse(req.body || {});

    await db.insert(subscriptions)
      .values({ subscriber_id: req.user.sub, professor_id: professorId, notificaciones })
      .onDuplicateKeyUpdate({ set: { notificaciones } });

    const [sub] = await db.select({ nombre: users.nombre }).from(users).where(eq(users.id, req.user.sub));
    if (sub) {
      await db.insert(notifications).values({
        user_id: professorId,
        mensaje: `${sub.nombre} se ha suscrito a tu canal`,
      });
    }

    res.json({ status: 'success', data: { message: 'Suscripción exitosa' } });
  } catch (err) { next(err); }
});

// DELETE /api/subscriptions/:professorId
router.delete('/:professorId', verifyToken, async (req, res, next) => {
  try {
    const professorId = Number(req.params.professorId);
    await db.delete(subscriptions).where(
      and(eq(subscriptions.subscriber_id, req.user.sub), eq(subscriptions.professor_id, professorId))
    );
    res.json({ status: 'success', data: { message: 'Suscripción cancelada' } });
  } catch (err) { next(err); }
});

export default router;
