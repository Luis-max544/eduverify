import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../config/db.js';
import { users, resetTokens } from '../db/schema.js';
import { env } from '../config/env.js';
import { sendPasswordReset } from '../services/email.js';
import { verifyGoogleCredential } from '../services/google.js';
import { mediaUrl } from '../config/minio.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, rol: user.rol, premium: user.premium, tier: user.tier, membresia_docente: user.membresia_docente },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
}

function formatUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    tier: user.tier,
    premium: user.premium,
    membresia_docente: user.membresia_docente,
    membresia_docente_expires_at: user.membresia_docente_expires_at,
    canal_precio: user.canal_precio ? Number(user.canal_precio) : null,
    dark_mode: user.dark_mode,
    avatar_url: mediaUrl(user.avatar_path),
    banner_url: mediaUrl(user.banner_path),
  };
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { correo, password } = z.object({
      correo: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, correo));
    if (!user || !user.password_hash) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });

    res.json({ status: 'success', data: { token: signToken(user), user: formatUser(user) } });
  } catch (err) { next(err); }
});

// POST /api/auth/registro
router.post('/registro', async (req, res, next) => {
  try {
    const { nombre, correo, password, rol } = z.object({
      nombre: z.string().min(2).max(120),
      correo: z.string().email(),
      password: z.string().min(8),
      rol: z.enum(['estudiante', 'profesor', 'creador']).default('estudiante'),
    }).parse(req.body);

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, correo));
    if (existing) return res.status(409).json({ status: 'error', message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ nombre, email: correo, password_hash: hash, rol });

    res.status(201).json({ status: 'success', data: { message: 'Usuario creado exitosamente' } });
  } catch (err) { next(err); }
});

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = z.object({ credential: z.string() }).parse(req.body);
    const googleUser = await verifyGoogleCredential(credential);

    let [user] = await db.select().from(users).where(eq(users.google_sub, googleUser.sub));

    if (!user) {
      [user] = await db.select().from(users).where(eq(users.email, googleUser.email));
    }

    if (!user) {
      await db.insert(users).values({
        nombre: googleUser.nombre,
        email: googleUser.email,
        google_sub: googleUser.sub,
        rol: 'estudiante',
      });
      [user] = await db.select().from(users).where(eq(users.email, googleUser.email));
    } else if (!user.google_sub) {
      await db.update(users).set({ google_sub: googleUser.sub }).where(eq(users.id, user.id));
    }

    res.json({ status: 'success', data: { token: signToken(user), user: formatUser(user) } });
  } catch (err) { next(err); }
});

// POST /api/auth/cambiar-password
router.post('/cambiar-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(resetTokens).values({ user_id: user.id, token, expires_at: expiresAt });
      await sendPasswordReset(email, user.id, token);
    }

    res.json({ status: 'success', data: { message: 'Si el email existe, recibirás un enlace de recuperación' } });
  } catch (err) { next(err); }
});

// POST /api/auth/actualizar-password
router.post('/actualizar-password', async (req, res, next) => {
  try {
    const { id, token, password } = z.object({
      id: z.coerce.number().int().positive(),
      token: z.string(),
      password: z.string().min(8),
    }).parse(req.body);

    const now = new Date();
    const [resetToken] = await db.select().from(resetTokens).where(
      and(
        eq(resetTokens.user_id, id),
        eq(resetTokens.token, token),
        eq(resetTokens.used, false),
        gt(resetTokens.expires_at, now)
      )
    );

    if (!resetToken) {
      return res.status(400).json({ status: 'error', message: 'Token inválido o expirado' });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.update(users).set({ password_hash: hash }).where(eq(users.id, id));
    await db.update(resetTokens).set({ used: true }).where(eq(resetTokens.id, resetToken.id));

    res.json({ status: 'success', data: { message: 'Contraseña actualizada exitosamente' } });
  } catch (err) { next(err); }
});

export default router;
