// Helpers para registrar histórico de proyectos (no usado aún en runtime)
import { pool } from '../../db/pool.js';

export const recordHistory = async ({ proyectoId, userId, action, diff }) => {
  await pool.execute(
    `INSERT INTO proyectos_history (proyecto_id, user_id, action, diff)
     VALUES (?, ?, ?, ?)`,
    [proyectoId, userId ?? null, action, diff ? JSON.stringify(diff) : null]
  );
};

export const buildDiff = (before, after) => {
  if (!before || !after) return { before, after };
  const changed = {};
  const fields = [
    'title',
    'descripcion',
    'resumen',
    'cicloId',
    'cursoAcademico',
    'tags',
    'alumnos',
    'status',
    'videoUrl',
    'pdfUrls'
  ];
  for (const f of fields) {
    if (JSON.stringify(before[f]) !== JSON.stringify(after[f])) {
      changed[f] = { before: before[f], after: after[f] };
    }
  }
  return changed;
};
