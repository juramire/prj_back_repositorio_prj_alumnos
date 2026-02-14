import express from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../../config/env.js';
import { listPublic, getPublicById, getById, getByUser, createProyecto } from '../proyectos/proyectos.service.js';
import { login as loginService } from '../auth/auth.service.js';
import { listAdmin, getAdminProyecto, adminUpdateProyecto } from '../admin/admin.service.js';
import { pool } from '../../db/pool.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = express.Router();

// Helpers
const mapRole = r => (r === 'admin' ? 'ADMIN' : r === 'profesor' ? 'PROFESOR' : 'USER');
const parseTecnologias = tags => (Array.isArray(tags) ? tags : []);
const mapPublicItem = p => ({
  id: p.id,
  titulo: p.title,
  curso: p.cursoAcademico,
  descripcionCorta: p.resumen || (p.descripcion ? p.descripcion.slice(0, 160) : ''),
  imagenUrl: p.imageUrl ?? null,
  anio: p.createdAt ? new Date(p.createdAt).getFullYear().toString() : null,
  tecnologias: parseTecnologias(p.tags)
});

// Vistas simples
router.get('/login', (_req, res) => res.json({ ok: true }));
router.get('/form', (_req, res) => res.json({ ok: true }));
router.get('/forgot-password', (_req, res) => res.json({ ok: true }));

// Auth endpoints
router.post('/login', asyncHandler(async (req, res) => {
  const email = req.body?.correo ?? req.body?.email;
  const password = req.body?.passwd ?? req.body?.password;
  if (!email || !password) return res.status(400).json({ message: 'correo y passwd requeridos' });
  const result = await loginService(email, password);
  if (!result) return res.status(401).json({ message: 'Credenciales inválidas' });
  const user = result.user;
  res.json({ token: result.token, user: { id: user.id, nombre: user.name, correo: user.email, role: mapRole(user.rol) } });
}));

router.post('/logout', (_req, res) => res.json({ ok: true }));

// Home público
router.get('/home', asyncHandler(async (req, res) => {
  const list = await listPublic(req.query);
  res.json(list.items.map(mapPublicItem));
}));

// Home privado: requiere token
router.get('/home/:id', requireAuth, asyncHandler(async (req, res) => {
  // devuelve published + proyectos propios del usuario
  const published = await listPublic(req.query);
  const mine = await getByUser(req.user.id);
  const items = published.items.map(mapPublicItem);
  if (mine) items.unshift(mapPublicItem(mine));
  res.json(items);
}));

// Detalle
router.get('/home/:id/desc', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  // Try public
  let proyecto = await getPublicById(id);
  if (!proyecto) {
    // if not public, try getById and allow only if owner via token
    const byId = await getById(id);
    if (!byId) return res.status(404).json({ message: 'Proyecto no encontrado' });
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const jwt = await import('jsonwebtoken');
      const { config: cfg } = await import('../../config/env.js');
      const payload = jwt.verify(authHeader.slice(7), cfg.jwtSecret);
      if (payload.id !== byId.userId) return res.status(403).json({ message: 'Forbidden' });
      proyecto = byId;
    } catch (e) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
  const out = {
    id: proyecto.id,
    title: proyecto.title,
    autores: proyecto.alumnos ? (Array.isArray(proyecto.alumnos) ? proyecto.alumnos : proyecto.alumnos.split(',').map(s => s.trim()).filter(Boolean)) : [],
    descripcion: proyecto.descripcion,
    curso: proyecto.cursoAcademico,
    etiquetas: Array.isArray(proyecto.tags) ? proyecto.tags : (proyecto.tags ? proyecto.tags.split(',').map(s => s.trim()) : []),
    imagenUrl: proyecto.imageUrl ?? null,
    videoUrl: proyecto.videoUrl ?? null
  };
  res.json(out);
}));

// Multer for form uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(config.uploadDir)),
  filename: (req, file, cb) => {
    const uniq = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uniq}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Crear proyecto (multipart)
router.post('/form', requireAuth, upload.fields([{ name: 'imagen' }, { name: 'video' }]), asyncHandler(async (req, res) => {
  // roles allowed: profesor, admin
  const rol = req.user?.rol;
  if (!['profesor', 'admin'].includes(rol)) return res.status(403).json({ message: 'Forbidden' });
  const body = req.body || {};
  const parsed = {
    title: body.titulo ?? body.title,
    cursoAcademico: body.curso ?? body.cursoAcademico,
    descripcion: body.descripcion ?? body.description,
    resumen: body.resumen ?? body.summary ?? (body.descripcion ? (body.descripcion.slice(0, 160)) : ''),
    alumnos: (() => {
      try {
        const a = JSON.parse(body.autores);
        return Array.isArray(a) ? a.join(', ') : (body.autores || '');
      } catch { return body.autores ?? '' }
    })(),
    tags: (() => {
      try {
        const t = JSON.parse(body.etiquetas);
        return Array.isArray(t) ? t.join(', ') : (body.etiquetas || '');
      } catch { return body.etiquetas ?? '' }
    })(),
    ciclo: body.ciclo ?? null
  };
  if (!parsed.ciclo) parsed.ciclo = req.user?.ciclo_id ?? null;

  const created = await createProyecto(req.user.id, parsed);
  const files = req.files || {};
  const updates = {};
  if (files.video && files.video[0]) updates.video_url = `/uploads/${files.video[0].filename}`;
  if (files.imagen && files.imagen[0]) updates.image_url = `/uploads/${files.imagen[0].filename}`;
  if (Object.keys(updates).length) {
    const sets = [];
    const params = [];
    if (updates.video_url) { sets.push('video_url = ?'); params.push(updates.video_url); }
    if (updates.image_url) { sets.push('image_url = ?'); params.push(updates.image_url); }
    params.push(new Date(), created.id);
    await pool.execute(`UPDATE proyectos SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, params);
  }
  res.status(201).json({ id: created.id });
}));

// Admin panel routes (require admin)
router.get('/admin-panel', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const list = await listAdmin(req.query);
  res.json(list);
}));

router.get('/admin-panel/:id', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const id = Number(req.params.id);
  const proyecto = await getAdminProyecto(id);
  if (!proyecto) return res.status(404).json({ message: 'Proyecto no encontrado' });
  res.json({
    id: proyecto.id,
    titulo: proyecto.title,
    curso: proyecto.cursoAcademico,
    descripcion: proyecto.descripcion,
    autores: proyecto.alumnos ? proyecto.alumnos.split(',').map(s => s.trim()).filter(Boolean) : [],
    etiquetas: Array.isArray(proyecto.tags) ? proyecto.tags : (proyecto.tags ? proyecto.tags.split(',').map(s => s.trim()) : []),
    imagenUrl: proyecto.imageUrl ?? null,
    videoUrl: proyecto.videoUrl ?? null,
    status: proyecto.status,
    ciclo_id: proyecto.cicloId
  });
}));

router.put('/admin-panel/:id', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const id = Number(req.params.id);
  const body = req.body;
  const payload = {
    title: body.titulo ?? body.title,
    cursoAcademico: body.curso ?? body.cursoAcademico,
    descripcion: body.descripcion ?? body.description,
    alumnos: Array.isArray(body.autores) ? body.autores.join(', ') : (body.autores ?? ''),
    tags: Array.isArray(body.etiquetas) ? body.etiquetas.join(', ') : (body.etiquetas ?? '')
  };
  const updated = await adminUpdateProyecto(id, payload);
  res.json(updated);
}));

router.delete('/admin-panel/:id', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const id = Number(req.params.id);
  const [rows] = await pool.execute('SELECT id FROM proyectos WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return res.status(404).json({ message: 'Proyecto no encontrado' });
  await pool.execute('DELETE FROM proyectos WHERE id = ?', [id]);
  res.json({ ok: true });
}));

// Forgot password POST stub
router.post('/forgot-password', (_req, res) => res.json({ ok: true }));

export default router;
