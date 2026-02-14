import { pool } from '../../db/pool.js';
import { parsePagination } from '../../utils/pagination.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { toProyectoDTO } from '../../utils/dto-mapper.js';
import { updateProyecto, getById } from '../proyectos/proyectos.service.js';
import mysql from 'mysql2';

const buildSearch = (q, params) => {
  if (!q) return '';
  const like = `%${q}%`;
  params.push(like, like, like);
  return '(p.title LIKE ? OR p.descripcion LIKE ? OR p.tags LIKE ?)';
};

export const listAdmin = async query => {
  const { page, pageSize, offset } = parsePagination(query, { page: 1, pageSize: 10, maxPageSize: 50 });
  const params = [];
  const whereParts = ['1=1'];
  if (query.curso) {
    whereParts.push('curso_academico = ?');
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
  if (query.status) {
    whereParts.push('status = ?');
    params.push(sanitizeString(query.status));
  }
  if (query.q) {
    const clause = buildSearch(sanitizeString(query.q), params);
    if (clause) whereParts.push(clause);
  }

  const where = 'WHERE ' + whereParts.join(' AND ');

  const sqlList = mysql.format(
    `SELECT p.id, p.user_id, p.title, p.descripcion, p.resumen, p.ciclo_id, c.descripcion AS ciclo_formativo, p.curso_academico, p.tags, p.alumnos, p.status, p.video_url, p.image_url, p.pdf_urls, p.created_at, p.updated_at
     FROM proyectos p
     JOIN ciclos_formativos c ON c.id = p.ciclo_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [rows] = await pool.query(sqlList);

  const sqlCount = mysql.format(`SELECT COUNT(*) as total FROM proyectos p JOIN ciclos_formativos c ON c.id=p.ciclo_id ${where}`, params);
  const [[{ total }]] = await pool.query(sqlCount);
  return { items: rows.map(toProyectoDTO), total, page, pageSize };
};

export const getAdminProyecto = async id => getById(id);

export const adminUpdateProyecto = async (id, body) => updateProyecto(id, null, body, { allowAdmin: true });

export const adminSetStatus = async (id, status) => {
  const proyecto = await getById(id);
  if (!proyecto) {
    const err = new Error('Proyecto no encontrado');
    err.status = 404;
    throw err;
  }
  const now = new Date();
  await pool.execute(
    `UPDATE proyectos
     SET status = ?,
         submitted_at = IF(?='SUBMITTED', ?, submitted_at),
         published_at = IF(?='PUBLISHED', ?, published_at),
         updated_at = ?
     WHERE id = ?`,
    [status, status, now, status, now, now, id]
  );
  return getById(id);
};
