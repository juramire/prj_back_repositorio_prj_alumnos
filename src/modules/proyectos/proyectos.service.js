import { pool } from '../../db/pool.js';
import mysql from 'mysql2';
import { toProyectoDTO, toProyectoPublicDTO } from '../../utils/dto-mapper.js';
import { sanitizeString, sanitizeTags } from '../../utils/sanitize.js';
import { parsePagination } from '../../utils/pagination.js';

const findCicloId = async cicloInput => {
  if (cicloInput === undefined || cicloInput === null) return null;
  const num = Number(cicloInput);
  if (Number.isInteger(num) && num > 0) return num;
  const desc = sanitizeString(cicloInput);
  if (!desc) return null;
  const [rows] = await pool.execute(
    'SELECT id FROM ciclos_formativos WHERE LOWER(descripcion) = ? LIMIT 1',
    [desc.toLowerCase()]
  );
  return rows[0]?.id ?? null;
};

const buildSearchClause = (q, params) => {
  if (!q) return '';
  const like = `%${q}%`;
  params.push(like, like, like);
  return '(p.title LIKE ? OR p.descripcion LIKE ? OR p.tags LIKE ?)';
};

export const listPublic = async query => {
  const { page, pageSize, offset } = parsePagination(query, { page: 1, pageSize: 9, maxPageSize: 50 });
  const params = [];
  const whereParts = ['p.status = "PUBLISHED"'];
  if (query.curso) {
    whereParts.push('p.curso_academico = ?');
    params.push(sanitizeString(query.curso));
  }
  if (query.ciclo) {
    const ciclo = sanitizeString(query.ciclo);
    const num = Number(ciclo);
    if (Number.isInteger(num) && num > 0) {
      whereParts.push('p.ciclo_id = ?');
      params.push(num);
    } else {
      whereParts.push('LOWER(c.descripcion) = ?');
      params.push(ciclo.toLowerCase());
    }
  }
  if (query.q) {
    const clause = buildSearchClause(sanitizeString(query.q), params);
    if (clause) whereParts.push(clause);
  }
  const where = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

  const sqlList = mysql.format(
    `SELECT p.id, p.title, p.descripcion, p.resumen, p.ciclo_id, c.descripcion AS ciclo_formativo, p.curso_academico, p.tags, p.alumnos, p.status, p.video_url, p.image_url, p.pdf_urls, p.created_at, p.updated_at
     FROM proyectos p
     JOIN ciclos_formativos c ON c.id = p.ciclo_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [rows] = await pool.query(sqlList);

  const sqlCount = mysql.format(
    `SELECT COUNT(*) as total FROM proyectos p JOIN ciclos_formativos c ON c.id = p.ciclo_id ${where}`,
    params
  );
  const [[{ total }]] = await pool.query(sqlCount);
  return { items: rows.map(toProyectoPublicDTO), total, page, pageSize };
};

export const getPublicById = async id => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.title, p.descripcion, p.resumen, p.ciclo_id, c.descripcion AS ciclo_formativo, p.curso_academico, p.tags, p.alumnos, p.status, p.video_url, p.image_url, p.pdf_urls, p.created_at, p.updated_at
     FROM proyectos p
     JOIN ciclos_formativos c ON c.id = p.ciclo_id
     WHERE p.id = ? AND p.status = "PUBLISHED" LIMIT 1`,
    [id]
  );
  return rows[0] ? toProyectoPublicDTO(rows[0]) : null;
};

export const getByUser = async userId => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.user_id, p.title, p.descripcion, p.resumen, p.ciclo_id, c.descripcion AS ciclo_formativo, p.curso_academico, p.tags, p.alumnos, p.status, p.video_url, p.image_url, p.pdf_urls, p.created_at, p.updated_at
     FROM proyectos p
     JOIN ciclos_formativos c ON c.id = p.ciclo_id
     WHERE p.user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] ? toProyectoDTO(rows[0]) : null;
};

export const getById = async id => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.user_id, p.title, p.descripcion, p.resumen, p.ciclo_id, c.descripcion AS ciclo_formativo, p.curso_academico, p.tags, p.alumnos, p.status, p.video_url, p.image_url, p.pdf_urls, p.created_at, p.updated_at
     FROM proyectos p
     JOIN ciclos_formativos c ON c.id = p.ciclo_id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ? toProyectoDTO(rows[0]) : null;
};

export const createProyecto = async (userId, body) => {
  const title = sanitizeString(body.title);
  const descripcion = sanitizeString(body.descripcion);
  const resumen = sanitizeString(body.resumen);
  const cicloInput = body.cicloId ?? body.cicloFormativo ?? body.ciclo_formativo ?? body.ciclo;
  const cicloId = await findCicloId(cicloInput);
  const cursoAcademico = sanitizeString(body.cursoAcademico);
  const tags = sanitizeTags(body.tags);
  const alumnos = sanitizeString(body.alumnos ?? '');

  if (!title || !descripcion || !resumen || !cicloId || !cursoAcademico) {
    const err = new Error('Campos requeridos faltantes');
    err.status = 400;
    throw err;
  }
  const existing = await getByUser(userId);
  if (existing) {
    const err = new Error('Ya tienes un proyecto');
    err.status = 400;
    throw err;
  }
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO proyectos
     (user_id, title, descripcion, resumen, ciclo_id, curso_academico, tags, alumnos, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, "NOT_SEND", ?, ?)`,
    [userId, title, descripcion, resumen, cicloId, cursoAcademico, tags.join(', '), alumnos, now, now]
  );
  return getById(result.insertId);
};

export const updateProyecto = async (id, userId, body, { allowAdmin = false } = {}) => {
  const proyecto = await getById(id);
  if (!proyecto) {
    const err = new Error('Proyecto no encontrado');
    err.status = 404;
    throw err;
  }
  if (!allowAdmin && proyecto.userId !== userId) {
    const err = new Error('No autorizado');
    err.status = 403;
    throw err;
  }
  if (!allowAdmin && proyecto.status === 'PUBLISHED') {
    const err = new Error('No se puede editar un proyecto publicado');
    err.status = 400;
    throw err;
  }

  const title = sanitizeString(body.title);
  const descripcion = sanitizeString(body.descripcion);
  const resumen = sanitizeString(body.resumen);
  const cicloInput = body.cicloId ?? body.cicloFormativo ?? body.ciclo_formativo ?? body.ciclo;
  const cicloId = cicloInput !== undefined ? await findCicloId(cicloInput) : proyecto.cicloId;
  const cursoAcademico = sanitizeString(body.cursoAcademico);
  const tags = sanitizeTags(body.tags);
  const alumnos = sanitizeString(body.alumnos ?? '');

  if (!title || !descripcion || !resumen || !cicloId || !cursoAcademico) {
    const err = new Error('Campos requeridos faltantes');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const nextStatus =
    allowAdmin && body.status && ['NOT_SEND', 'SUBMITTED', 'PUBLISHED'].includes(body.status) ? body.status : proyecto.status;

  await pool.execute(
    `UPDATE proyectos
         SET title = ?,
         descripcion = ?,
         resumen = ?,
         ciclo_id = ?,
         curso_academico = ?,
         tags = ?,
         alumnos = ?,
         status = ?,
         submitted_at = IF(?='SUBMITTED', ?, submitted_at),
         published_at = IF(?='PUBLISHED', ?, published_at),
         updated_at = ?
     WHERE id = ?`,
    [
      title,
      descripcion,
      resumen,
      cicloId,
      cursoAcademico,
      tags.join(', '),
      alumnos || proyecto.alumnos || '',
      nextStatus,
      nextStatus,
      now,
      nextStatus,
      now,
      now,
      id
    ]
  );
  return getById(id);
};

export const deleteProyecto = async (id, userId) => {
  const proyecto = await getById(id);
  if (!proyecto) {
    const err = new Error('Proyecto no encontrado');
    err.status = 404;
    throw err;
  }
  if (proyecto.userId !== userId) {
    const err = new Error('No autorizado');
    err.status = 403;
    throw err;
  }
  if (proyecto.status === 'PUBLISHED') {
    const err = new Error('No se puede borrar un proyecto publicado');
    err.status = 400;
    throw err;
  }
  await pool.execute('DELETE FROM proyectos WHERE id = ?', [id]);
};

export const enviarProyecto = async (id, userId) => {
  const proyecto = await getById(id);
  if (!proyecto) {
    const err = new Error('Proyecto no encontrado');
    err.status = 404;
    throw err;
  }
  if (proyecto.userId !== userId) {
    const err = new Error('No autorizado');
    err.status = 403;
    throw err;
  }
  if (proyecto.status !== 'NOT_SEND') {
    const err = new Error('Solo se puede enviar un borrador');
    err.status = 400;
    throw err;
  }
  const now = new Date();
  await pool.execute(
    'UPDATE proyectos SET status = "SUBMITTED", submitted_at = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  );
  return getById(id);
};

export const updateFiles = async (id, { videoUrl, pdfUrls, imageUrl } = {}) => {
  const proyecto = await getById(id);
  if (!proyecto) {
    const err = new Error('Proyecto no encontrado');
    err.status = 404;
    throw err;
  }
  const nextPdfUrls = pdfUrls ?? proyecto.pdfUrls ?? [];
  await pool.execute(
    'UPDATE proyectos SET video_url = ?, pdf_urls = ?, image_url = ?, updated_at = ? WHERE id = ?',
    [videoUrl ?? proyecto.videoUrl ?? null, JSON.stringify(nextPdfUrls), imageUrl ?? proyecto.imageUrl ?? null, new Date(), id]
  );
  return getById(id);
};
