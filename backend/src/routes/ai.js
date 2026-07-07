import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { db } from '../config/db.js';
import { videos, users } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

// Rate limit in-memory: 10 req/min por usuario (MVP — no escala multi-proceso)
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const requestLog = new Map();

function rateLimited(userId) {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) || []).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    requestLog.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return false;
}

const chatSchema = z.object({
  video_id: z.number().int().positive(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).min(1).max(20),
}).refine(
  ({ messages }) => messages[0].role === 'user' && messages[messages.length - 1].role === 'user',
  { message: 'El primer y último mensaje deben ser del usuario' }
);

// POST /api/ai/chat
router.post('/chat', verifyToken, async (req, res, next) => {
  try {
    if (!env.geminiKey) {
      return res.status(503).json({ status: 'error', message: 'El tutor IA no está configurado en este servidor' });
    }
    if (rateLimited(req.user.sub)) {
      return res.status(429).json({ status: 'error', message: 'Demasiadas solicitudes, espera un momento' });
    }

    const { video_id, messages } = chatSchema.parse(req.body);

    const [video] = await db
      .select({
        titulo: videos.titulo, descripcion: videos.descripcion,
        categoria: videos.categoria, autor: users.nombre,
      })
      .from(videos)
      .innerJoin(users, eq(videos.usuario_id, users.id))
      .where(eq(videos.id, video_id));
    if (!video) return res.status(404).json({ status: 'error', message: 'Video no encontrado' });

    const systemInstruction =
      `Eres un tutor educativo de EduVerify, una plataforma de clases en video. ` +
      `El estudiante está viendo la clase "${video.titulo}" (categoría: ${video.categoria}) ` +
      `impartida por ${video.autor}.` +
      (video.descripcion ? ` Descripción de la clase: ${video.descripcion}.` : '') +
      ` Responde en español, de forma breve, clara y pedagógica. ` +
      `Si la pregunta no tiene relación con la clase o su temática, redirige amablemente al tema.`;

    const ai = new GoogleGenAI({ apiKey: env.geminiKey });
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model: env.aiModel,
        contents,
        config: { systemInstruction, maxOutputTokens: 1024 },
      });
    } catch (err) {
      const status = err?.status ?? err?.error?.code;
      if (status === 429) {
        return res.status(429).json({ status: 'error', message: 'El tutor IA está saturado, intenta en unos segundos' });
      }
      console.error('Gemini error:', err?.message || err);
      return res.status(502).json({ status: 'error', message: 'El tutor IA no está disponible, intenta más tarde' });
    }

    res.json({ status: 'success', data: { reply: response.text } });
  } catch (err) { next(err); }
});

export default router;
