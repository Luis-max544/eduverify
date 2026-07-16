import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { coupons, profesorPlaylists } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// GET /api/profesor/playlists/:id/coupons
router.get('/profesor/playlists/:id/coupons', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const [pl] = await db.select({ user_id: profesorPlaylists.user_id }).from(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
    if (!pl || pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });

    const rows = await db.select().from(coupons).where(eq(coupons.playlist_id, playlistId));
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

const couponSchema = z.object({
  codigo:        z.string().min(3).max(50).transform(v => v.toUpperCase()),
  descuento_pct: z.number().int().min(1).max(100),
  usos_max:      z.number().int().positive().nullable().optional(),
  expires_at:    z.string().datetime().nullable().optional(),
});

// POST /api/profesor/playlists/:id/coupons
router.post('/profesor/playlists/:id/coupons', verifyToken, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const [pl] = await db.select({ user_id: profesorPlaylists.user_id, precio: profesorPlaylists.precio })
      .from(profesorPlaylists).where(eq(profesorPlaylists.id, playlistId));
    if (!pl || pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });
    if (!pl.precio) return res.status(400).json({ status: 'error', message: 'El curso no tiene precio — configura un precio antes de crear cupones' });

    const data = couponSchema.parse(req.body);
    const [inserted] = await db.insert(coupons).values({ playlist_id: playlistId, ...data }).$returningId();
    const [row] = await db.select().from(coupons).where(eq(coupons.id, inserted.id));
    res.status(201).json({ status: 'success', data: row });
  } catch (err) { next(err); }
});

// PATCH /api/coupons/:id
router.patch('/coupons/:id', verifyToken, async (req, res, next) => {
  try {
    const couponId = Number(req.params.id);
    const [cp] = await db.select({ playlist_id: coupons.playlist_id }).from(coupons).where(eq(coupons.id, couponId));
    if (!cp) return res.status(404).json({ status: 'error', message: 'Cupón no encontrado' });

    const [pl] = await db.select({ user_id: profesorPlaylists.user_id }).from(profesorPlaylists).where(eq(profesorPlaylists.id, cp.playlist_id));
    if (!pl || pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });

    const patch = z.object({
      activo:    z.boolean().optional(),
      usos_max:  z.number().int().positive().nullable().optional(),
      expires_at: z.string().datetime().nullable().optional(),
    }).parse(req.body);

    await db.update(coupons).set(patch).where(eq(coupons.id, couponId));
    const [updated] = await db.select().from(coupons).where(eq(coupons.id, couponId));
    res.json({ status: 'success', data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/coupons/:id
router.delete('/coupons/:id', verifyToken, async (req, res, next) => {
  try {
    const couponId = Number(req.params.id);
    const [cp] = await db.select({ playlist_id: coupons.playlist_id }).from(coupons).where(eq(coupons.id, couponId));
    if (!cp) return res.status(404).json({ status: 'error', message: 'Cupón no encontrado' });

    const [pl] = await db.select({ user_id: profesorPlaylists.user_id }).from(profesorPlaylists).where(eq(profesorPlaylists.id, cp.playlist_id));
    if (!pl || pl.user_id !== req.user.sub) return res.status(403).json({ status: 'error', message: 'No autorizado' });

    await db.delete(coupons).where(eq(coupons.id, couponId));
    res.json({ status: 'success', data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
