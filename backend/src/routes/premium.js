import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// POST /api/premium/activate
router.post('/activate', verifyToken, async (req, res, next) => {
  try {
    const fechaPago = new Date();
    await db.update(users)
      .set({ premium: true, fecha_pago: fechaPago })
      .where(eq(users.id, req.user.sub));

    res.json({ status: 'success', data: { premium: true, fecha_pago: fechaPago } });
  } catch (err) { next(err); }
});

// GET /api/premium/status
router.get('/status', verifyToken, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ premium: users.premium, fecha_pago: users.fecha_pago })
      .from(users)
      .where(eq(users.id, req.user.sub));
    res.json({ status: 'success', data: user });
  } catch (err) { next(err); }
});

export default router;
