import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createIncidencia } from './incidencias.service.js';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: req => `incidencias:${req.user?.id ?? req.ip}`,
  standardHeaders: true,
  legacyHeaders: false
});

router.post(
  '/',
  requireAuth,
  limiter,
  asyncHandler(async (req, res) => {
    const incidencia = await createIncidencia(req.user, req.body);
    res.status(201).json(incidencia);
  })
);

export default router;
