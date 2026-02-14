import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id, rol: payload.rol, email: payload.email, name: payload.name };
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const requireRole = roles => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!req.user || !allowed.includes(req.user.rol)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

// Compat alias para código existente
export const requireAdmin = requireRole(['profesor', 'admin']);
