import { Router } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../config/db.js';
import { channelSubscriptions, users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

function now() { return new Date(); }
function plus30d() { return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); }

// GET /api/channel-subs — list active channel subs for current user
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        professor_id: channelSubscriptions.professor_id,
        monto_pagado: channelSubscriptions.monto_pagado,
        expires_at:   channelSubscriptions.expires_at,
        created_at:   channelSubscriptions.created_at,
        nombre:       users.nombre,
        avatar_path:  users.avatar_path,
      })
      .from(channelSubscriptions)
      .innerJoin(users, eq(channelSubscriptions.professor_id, users.id))
      .where(and(
        eq(channelSubscriptions.subscriber_id, req.user.sub),
        gt(channelSubscriptions.expires_at, now()),
      ));
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

// GET /api/channel-subs/check/:professorId
router.get('/check/:professorId', verifyToken, async (req, res, next) => {
  try {
    const profId = Number(req.params.professorId);
    const [row] = await db
      .select()
      .from(channelSubscriptions)
      .where(and(
        eq(channelSubscriptions.subscriber_id, req.user.sub),
        eq(channelSubscriptions.professor_id, profId),
        gt(channelSubscriptions.expires_at, now()),
      ));
    res.json({ status: 'success', data: { suscrito: !!row, expires_at: row?.expires_at ?? null } });
  } catch (err) { next(err); }
});

// POST /api/channel-subs/:professorId — subscribe
router.post('/:professorId', verifyToken, async (req, res, next) => {
  try {
    const profId = Number(req.params.professorId);
    if (profId === req.user.sub) {
      return res.status(400).json({ status: 'error', message: 'No puedes suscribirte a tu propio canal' });
    }

    const [prof] = await db.select({ canal_precio: users.canal_precio }).from(users).where(eq(users.id, profId));
    if (!prof) return res.status(404).json({ status: 'error', message: 'Canal no encontrado' });
    if (!prof.canal_precio) return res.status(400).json({ status: 'error', message: 'Este canal no tiene membresía activa' });

    const expires = plus30d();
    await db.insert(channelSubscriptions)
      .values({ subscriber_id: req.user.sub, professor_id: profId, monto_pagado: prof.canal_precio, expires_at: expires })
      .onDuplicateKeyUpdate({ set: { monto_pagado: prof.canal_precio, expires_at: expires } });

    res.json({ status: 'success', data: { suscrito: true, expires_at: expires, monto_pagado: Number(prof.canal_precio) } });
  } catch (err) { next(err); }
});

// DELETE /api/channel-subs/:professorId — unsubscribe
router.delete('/:professorId', verifyToken, async (req, res, next) => {
  try {
    const profId = Number(req.params.professorId);
    await db.delete(channelSubscriptions).where(and(
      eq(channelSubscriptions.subscriber_id, req.user.sub),
      eq(channelSubscriptions.professor_id, profId),
    ));
    res.json({ status: 'success', data: { suscrito: false } });
  } catch (err) { next(err); }
});

export default router;
