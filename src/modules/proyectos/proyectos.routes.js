import express from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import {
  listPublic,
  getPublicById,
  getByUser,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  enviarProyecto
} from './proyectos.service.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = express.Router();

// Público
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await listPublic(req.query);
    res.json(result);
  })
);

// Usuario actual
router.get(
  '/mio',
  requireAuth,
  asyncHandler(async (req, res) => {
    const proyecto = await getByUser(req.user.id);
    if (!proyecto) return res.status(404).json({ message: 'No tienes proyecto' });
    res.json(proyecto);
  })
);

// Crear
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const created = await createProyecto(req.user.id, req.body);
    res.status(201).json(created);
  })
);

// Actualizar
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateProyecto(Number(req.params.id), req.user.id, req.body);
    res.json(updated);
  })
);

// Borrar
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteProyecto(Number(req.params.id), req.user.id);
    res.status(204).send();
  })
);

// Enviar a validar
router.post(
  '/:id/enviar',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await enviarProyecto(Number(req.params.id), req.user.id);
    res.json(updated);
  })
);

// Detalle público (debe ir después de rutas específicas)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const proyecto = await getPublicById(Number(req.params.id));
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });
    res.json(proyecto);
  })
);

export default router;
