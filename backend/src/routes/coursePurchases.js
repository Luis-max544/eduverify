import { Router } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import {
  coursePurchases, profesorPlaylists, coupons,
  courseEnrollments, lessonProgress, profesorPlaylistVideos,
} from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const REFUND_DAYS = 7;
const REFUND_MAX_PROGRESS = 30;

async function getProgresoPct(userId, playlistId) {
  const lecciones = await db
    .select({ video_id: profesorPlaylistVideos.video_id })
    .from(profesorPlaylistVideos)
    .where(eq(profesorPlaylistVideos.playlist_id, playlistId));
  if (!lecciones.length) return 0;

  const completadas = await db
    .select({ video_id: lessonProgress.video_id })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.user_id, userId), eq(lessonProgress.playlist_id, playlistId)));
  return Math.round((completadas.length / lecciones.length) * 100);
}

// POST /api/cursos/:id/purchase
router.post('/cursos/:id/purchase', verifyToken, async (req, res, next) => {
  try {
    const cursoId = Number(req.params.id);
    const userId = req.user.sub;
    const { codigo } = z.object({ codigo: z.string().optional() }).parse(req.body ?? {});

    const [curso] = await db.select({ precio: profesorPlaylists.precio, user_id: profesorPlaylists.user_id })
      .from(profesorPlaylists).where(eq(profesorPlaylists.id, cursoId));
    if (!curso) return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    if (!curso.precio) return res.status(400).json({ status: 'error', message: 'Este curso no tiene precio individual' });
    if (curso.user_id === userId) return res.status(400).json({ status: 'error', message: 'No puedes comprar tu propio curso' });

    const [existing] = await db.select({ refunded_at: coursePurchases.refunded_at })
      .from(coursePurchases)
      .where(and(eq(coursePurchases.user_id, userId), eq(coursePurchases.playlist_id, cursoId)));
    if (existing && !existing.refunded_at) return res.status(400).json({ status: 'error', message: 'Ya compraste este curso' });

    let precioFinal = Number(curso.precio);
    let couponRow = null;

    if (codigo) {
      const [cp] = await db.select().from(coupons).where(
        and(eq(coupons.codigo, codigo.toUpperCase()), eq(coupons.playlist_id, cursoId), eq(coupons.activo, true))
      );
      if (!cp) return res.status(400).json({ status: 'error', message: 'Cupón inválido o no aplica a este curso' });
      if (cp.expires_at && new Date(cp.expires_at) < new Date()) return res.status(400).json({ status: 'error', message: 'Cupón expirado' });
      if (cp.usos_max !== null && cp.usos_actuales >= cp.usos_max) return res.status(400).json({ status: 'error', message: 'Cupón agotado' });
      precioFinal = Math.max(0, precioFinal * (1 - cp.descuento_pct / 100));
      couponRow = cp;
    }

    await db.transaction(async (tx) => {
      if (existing?.refunded_at) {
        await tx.update(coursePurchases)
          .set({ precio_pagado: precioFinal.toFixed(2), purchased_at: new Date(), refunded_at: null })
          .where(and(eq(coursePurchases.user_id, userId), eq(coursePurchases.playlist_id, cursoId)));
      } else {
        await tx.insert(coursePurchases).values({
          user_id: userId, playlist_id: cursoId, precio_pagado: precioFinal.toFixed(2), purchased_at: new Date(),
        });
      }
      // auto-enroll
      await tx.insert(courseEnrollments).values({ user_id: userId, playlist_id: cursoId })
        .onDuplicateKeyUpdate({ set: { enrolled_at: new Date() } });
      if (couponRow) {
        await tx.update(coupons).set({ usos_actuales: couponRow.usos_actuales + 1 }).where(eq(coupons.id, couponRow.id));
      }
    });

    res.json({ status: 'success', data: { comprado: true, precio_pagado: precioFinal } });
  } catch (err) { next(err); }
});

// GET /api/cursos/:id/purchase/status
router.get('/cursos/:id/purchase/status', verifyToken, async (req, res, next) => {
  try {
    const cursoId = Number(req.params.id);
    const [row] = await db.select().from(coursePurchases).where(
      and(eq(coursePurchases.user_id, req.user.sub), eq(coursePurchases.playlist_id, cursoId))
    );
    if (!row || row.refunded_at) {
      return res.json({ status: 'success', data: { comprado: false, refundable: false } });
    }
    const daysSince = (Date.now() - new Date(row.purchased_at).getTime()) / (1000 * 60 * 60 * 24);
    const pct = await getProgresoPct(req.user.sub, cursoId);
    const refundable = daysSince <= REFUND_DAYS && pct < REFUND_MAX_PROGRESS;
    res.json({ status: 'success', data: { comprado: true, purchased_at: row.purchased_at, refundable, progreso_pct: pct } });
  } catch (err) { next(err); }
});

// DELETE /api/cursos/:id/purchase/refund
router.delete('/cursos/:id/purchase/refund', verifyToken, async (req, res, next) => {
  try {
    const cursoId = Number(req.params.id);
    const userId = req.user.sub;
    const [row] = await db.select().from(coursePurchases).where(
      and(eq(coursePurchases.user_id, userId), eq(coursePurchases.playlist_id, cursoId))
    );
    if (!row || row.refunded_at) return res.status(400).json({ status: 'error', message: 'Compra no encontrada o ya reembolsada' });

    const daysSince = (Date.now() - new Date(row.purchased_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > REFUND_DAYS) return res.status(400).json({ status: 'error', message: 'La ventana de reembolso de 7 días ha expirado' });
    const pct = await getProgresoPct(userId, cursoId);
    if (pct >= REFUND_MAX_PROGRESS) return res.status(400).json({ status: 'error', message: `Has completado ${pct}% del curso — no apto para reembolso (límite: ${REFUND_MAX_PROGRESS}%)` });

    await db.update(coursePurchases).set({ refunded_at: new Date() })
      .where(and(eq(coursePurchases.user_id, userId), eq(coursePurchases.playlist_id, cursoId)));

    res.json({ status: 'success', data: { reembolsado: true } });
  } catch (err) { next(err); }
});

export default router;
