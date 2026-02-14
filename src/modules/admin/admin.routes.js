import express from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin } from '../../middlewares/auth.js';
import { listAdmin, getAdminProyecto, adminUpdateProyecto, adminSetStatus } from './admin.service.js';
import { listUsers, createUser, importUsers, updateUser, deleteUser, getUserById } from './admin.users.service.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'text/csv') return cb(new Error('Formato de archivo no soportado'));
    cb(null, true);
  }
});

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const result = await listUsers(req.query);
    res.json(result);
  })
);

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  })
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const user = await createUser(req.body);
    res.status(201).json(user);
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await updateUser(Number(req.params.id), req.body);
    res.json(user);
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    await deleteUser(Number(req.params.id));
    res.status(204).send();
  })
);

router.post(
  '/users/import',
  (req, res, next) => {
    csvUpload.single('file')(req, res, err => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'CSV demasiado grande (max 1MB)' });
      if (err.message === 'Formato de archivo no soportado') return res.status(415).json({ message: err.message });
      return res.status(400).json({ message: err.message });
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Archivo CSV requerido' });
    }
    const result = await importUsers(req.file.buffer);
    res.json(result);
  })
);

router.get(
  '/proyectos',
  asyncHandler(async (req, res) => {
    const result = await listAdmin(req.query);
    res.json(result);
  })
);

router.get(
  '/proyectos/:id',
  asyncHandler(async (req, res) => {
    const proyecto = await getAdminProyecto(Number(req.params.id));
    if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });
    res.json(proyecto);
  })
);

router.put(
  '/proyectos/:id',
  asyncHandler(async (req, res) => {
    const updated = await adminUpdateProyecto(Number(req.params.id), req.body);
    res.json(updated);
  })
);

router.post(
  '/proyectos/:id/publicar',
  asyncHandler(async (req, res) => {
    const updated = await adminSetStatus(Number(req.params.id), 'PUBLISHED');
    res.json(updated);
  })
);

router.post(
  '/proyectos/:id/submitted',
  asyncHandler(async (req, res) => {
    const updated = await adminSetStatus(Number(req.params.id), 'SUBMITTED');
    res.json(updated);
  })
);

export default router;
