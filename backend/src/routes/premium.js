import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, teacherMemberships } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// POST /api/premium/activate — tier: premium
router.post('/activate', verifyToken, async (req, res, next) => {
  try {
    const fechaPago = new Date();
    await db.update(users)
      .set({ premium: true, tier: 'premium', fecha_pago: fechaPago })
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { premium: true, tier: 'premium', fecha_pago: fechaPago } });
  } catch (err) { next(err); }
});

// DELETE /api/premium/cancel — back to free
router.delete('/cancel', verifyToken, async (req, res, next) => {
  try {
    await db.update(users)
      .set({ premium: false, tier: 'free', fecha_pago: null })
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { message: 'Membresía cancelada' } });
  } catch (err) { next(err); }
});

// POST /api/premium/activate-plus — tier: premium_plus
router.post('/activate-plus', verifyToken, async (req, res, next) => {
  try {
    const fechaPago = new Date();
    await db.update(users)
      .set({ premium: true, tier: 'premium_plus', fecha_pago: fechaPago })
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { premium: true, tier: 'premium_plus', fecha_pago: fechaPago } });
  } catch (err) { next(err); }
});

// DELETE /api/premium/cancel-plus — downgrade to premium
router.delete('/cancel-plus', verifyToken, async (req, res, next) => {
  try {
    await db.update(users)
      .set({ tier: 'premium' })
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { message: 'Premium+ cancelado, mantienes Premium' } });
  } catch (err) { next(err); }
});

// GET /api/premium/status
router.get('/status', verifyToken, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ premium: users.premium, tier: users.tier, fecha_pago: users.fecha_pago,
                 membresia_docente: users.membresia_docente, membresia_docente_expires_at: users.membresia_docente_expires_at })
      .from(users)
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: user });
  } catch (err) { next(err); }
});

// POST /api/premium/teacher-membership
router.post('/teacher-membership', verifyToken, async (req, res, next) => {
  try {
    const rol = req.user.rol;
    if (rol !== 'profesor' && rol !== 'creador') {
      return res.status(403).json({ status: 'error', message: 'Solo disponible para docentes' });
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db.update(users)
      .set({ membresia_docente: true, membresia_docente_expires_at: expires })
      .where(eq(users.id, req.user.sub));
    await db.insert(teacherMemberships).values({
      user_id: req.user.sub,
      fecha_pago: now,
      expires_at: expires,
      activa: true,
    });
    res.json({ status: 'success', data: { activa: true, expires_at: expires } });
  } catch (err) { next(err); }
});

// DELETE /api/premium/teacher-membership
router.delete('/teacher-membership', verifyToken, async (req, res, next) => {
  try {
    await db.update(users)
      .set({ membresia_docente: false, membresia_docente_expires_at: null })
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { message: 'Membresía docente cancelada' } });
  } catch (err) { next(err); }
});

// GET /api/premium/teacher-membership/status
router.get('/teacher-membership/status', verifyToken, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ membresia_docente: users.membresia_docente, membresia_docente_expires_at: users.membresia_docente_expires_at })
      .from(users)
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: { activa: user.membresia_docente, expires_at: user.membresia_docente_expires_at } });
  } catch (err) { next(err); }
});

export default router;
