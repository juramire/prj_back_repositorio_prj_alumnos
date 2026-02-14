import { pool } from '../../db/pool.js';
import { sanitizeString } from '../../utils/sanitize.js';

const validateDescripcion = raw => {
  const desc = sanitizeString(raw);
  if (!desc || desc.length < 5 || desc.length > 2000) {
    const err = new Error('descripcion debe tener entre 5 y 2000 caracteres');
    err.status = 400;
    throw err;
  }
  return desc;
};

export const createIncidencia = async (user, body) => {
  const descripcion = validateDescripcion(body?.descripcion);
  const contexto = body?.contexto ? sanitizeString(body.contexto) : null;
  const now = new Date();
  const [result] = await pool.execute(
    `INSERT INTO incidencias (user_id, email, name, descripcion, estado, contexto, created_at)
     VALUES (?, ?, ?, ?, 'ABIERTA', ?, ?)`,
    [user.id, user.email, user.name, descripcion, contexto, now]
  );
  return {
    id: result.insertId,
    userId: user.id,
    descripcion,
    estado: 'ABIERTA',
    createdAt: now.toISOString()
  };
};
