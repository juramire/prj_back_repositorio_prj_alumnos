import express from 'express';
import { login as loginService, findUserById } from './auth.service.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  const email = sanitizeString(req.body?.email);
  const password = req.body?.password ?? '';
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }
  try {
    const result = await loginService(email, password);
    if (!result) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
