import { env } from '../config/env.js';

export async function verifyGoogleCredential(credential) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  if (!res.ok) throw new Error('Token de Google inválido');

  const payload = await res.json();

  if (env.googleClientId && payload.aud !== env.googleClientId) {
    throw new Error('Token de Google no corresponde a este cliente');
  }

  return {
    sub: payload.sub,
    nombre: payload.name,
    email: payload.email,
    picture: payload.picture,
  };
}
