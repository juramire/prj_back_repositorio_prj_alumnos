import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../../middlewares/auth.js';
import { config } from '../../config/env.js';
import { getById, updateFiles } from '../proyectos/proyectos.service.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Solo se permiten vídeos'));
    }
    if (file.fieldname === 'pdfs' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten PDFs'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 }
]);

const baseHost = config.apiBaseUrl.replace(/\/api$/, '');
const publicUrl = filename => `${baseHost}/uploads/${filename}`;

const removeFiles = async files => {
  const fileList = Array.isArray(files) ? files : [files];
  await Promise.all(
    fileList.map(async f => {
      if (f?.path) {
        try {
          await fs.unlink(f.path);
        } catch {
          /* ignore */
        }
      }
    })
  );
};

router.post('/proyecto/:id', requireAuth, (req, res) => {
  upload(req, res, async err => {
    if (err) return res.status(400).json({ message: err.message });
    const proyectoId = Number(req.params.id);
    const files = req.files ?? {};
    const video = files.video?.[0];
    const pdfs = files.pdfs ?? [];
    const totalSize = (video?.size ?? 0) + pdfs.reduce((a, f) => a + (f.size ?? 0), 0);
    if (totalSize > 30 * 1024 * 1024) {
      await removeFiles([...pdfs, video]);
      return res.status(400).json({ message: 'El tamaño total no puede superar 30MB' });
    }
    try {
      const proyecto = await getById(proyectoId);
      if (!proyecto) {
        await removeFiles([...pdfs, video]);
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }
      if (proyecto.userId !== req.user.id && !['admin', 'profesor'].includes(req.user.rol)) {
        await removeFiles([...pdfs, video]);
        return res.status(403).json({ message: 'No autorizado' });
      }
      const videoUrl = video ? publicUrl(path.basename(video.path)) : proyecto.videoUrl;
      const pdfUrls = pdfs.length
        ? pdfs.map(f => publicUrl(path.basename(f.path)))
        : proyecto.pdfUrls ?? [];
      const updated = await updateFiles(proyectoId, { videoUrl, pdfUrls }, req.user.id);
      res.json({ videoUrl: updated.videoUrl, pdfUrls: updated.pdfUrls ?? [] });
    } catch (e) {
      await removeFiles([...pdfs, video]);
      res.status(500).json({ message: e.message });
    }
  });
});

export default router;
