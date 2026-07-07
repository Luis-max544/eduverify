import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Token requerido' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ status: 'error', message: 'Acceso no autorizado' });
    }
    next();
  };
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), env.jwtSecret); } catch { /* sin user */ }
  }
  next();
}
