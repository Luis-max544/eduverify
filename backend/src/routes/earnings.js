import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { channelSubscriptions, coursePurchases, profesorPlaylists, users } from '../db/schema.js';
import { verifyToken, requireRol } from '../middleware/auth.js';

const router = Router();

// GET /api/profesor/earnings
router.get('/', verifyToken, requireRol('profesor', 'creador'), async (req, res, next) => {
  try {
    const userId = req.user.sub;

    // Channel sub earnings
    const chRows = await db
      .select({
        month:    sql`DATE_FORMAT(${channelSubscriptions.created_at}, '%Y-%m')`,
        total:    sql`SUM(${channelSubscriptions.monto_pagado})`,
        count:    sql`COUNT(*)`,
      })
      .from(channelSubscriptions)
      .where(eq(channelSubscriptions.professor_id, userId))
      .groupBy(sql`DATE_FORMAT(${channelSubscriptions.created_at}, '%Y-%m')`);

    // Course purchase earnings (non-refunded)
    const cpRows = await db
      .select({
        month:       sql`DATE_FORMAT(${coursePurchases.purchased_at}, '%Y-%m')`,
        total:       sql`SUM(${coursePurchases.precio_pagado})`,
        count:       sql`COUNT(*)`,
        playlist_id: coursePurchases.playlist_id,
        nombre:      profesorPlaylists.nombre,
      })
      .from(coursePurchases)
      .innerJoin(profesorPlaylists, eq(coursePurchases.playlist_id, profesorPlaylists.id))
      .where(and(eq(profesorPlaylists.user_id, userId), sql`${coursePurchases.refunded_at} IS NULL`))
      .groupBy(sql`DATE_FORMAT(${coursePurchases.purchased_at}, '%Y-%m')`, coursePurchases.playlist_id, profesorPlaylists.nombre);

    // Recent transactions (last 20)
    const recentChSubs = await db
      .select({
        tipo:       sql`'channel_sub'`,
        monto:      channelSubscriptions.monto_pagado,
        created_at: channelSubscriptions.created_at,
        nombre_sub: users.nombre,
      })
      .from(channelSubscriptions)
      .innerJoin(users, eq(channelSubscriptions.subscriber_id, users.id))
      .where(eq(channelSubscriptions.professor_id, userId))
      .orderBy(sql`${channelSubscriptions.created_at} DESC`)
      .limit(10);

    const recentPurchases = await db
      .select({
        tipo:       sql`'course_purchase'`,
        monto:      coursePurchases.precio_pagado,
        created_at: coursePurchases.purchased_at,
        nombre_sub: users.nombre,
        curso:      profesorPlaylists.nombre,
      })
      .from(coursePurchases)
      .innerJoin(users, eq(coursePurchases.user_id, users.id))
      .innerJoin(profesorPlaylists, eq(coursePurchases.playlist_id, profesorPlaylists.id))
      .where(and(eq(profesorPlaylists.user_id, userId), sql`${coursePurchases.refunded_at} IS NULL`))
      .orderBy(sql`${coursePurchases.purchased_at} DESC`)
      .limit(10);

    const channelSubsTotal = chRows.reduce((s, r) => s + Number(r.total || 0), 0);
    const courseSalesTotal = cpRows.reduce((s, r) => s + Number(r.total || 0), 0);

    // Merge month breakdowns
    const monthMap = {};
    chRows.forEach(r => {
      monthMap[r.month] = monthMap[r.month] || { month: r.month, channel_subs: 0, course_sales: 0 };
      monthMap[r.month].channel_subs += Number(r.total || 0);
    });
    cpRows.forEach(r => {
      monthMap[r.month] = monthMap[r.month] || { month: r.month, channel_subs: 0, course_sales: 0 };
      monthMap[r.month].course_sales += Number(r.total || 0);
    });
    const breakdown_by_month = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));

    const recent_transactions = [
      ...recentChSubs.map(r => ({ tipo: 'channel_sub', monto: Number(r.monto), created_at: r.created_at, descripcion: `Mini-sub de ${r.nombre_sub}` })),
      ...recentPurchases.map(r => ({ tipo: 'course_purchase', monto: Number(r.monto), created_at: r.created_at, descripcion: `Compra de "${r.curso}" por ${r.nombre_sub}` })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);

    res.json({
      status: 'success',
      data: { channel_subs_total: channelSubsTotal, course_sales_total: courseSalesTotal, breakdown_by_month, recent_transactions },
    });
  } catch (err) { next(err); }
});

export default router;
