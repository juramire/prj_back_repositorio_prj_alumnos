import { pool } from '../../db/pool.js';
import { sanitizeString } from '../../utils/sanitize.js';

export const listCiclos = async query => {
  const params = [];
  let where = '';

  const q = sanitizeString(query?.q);
  if (q) {
    where = 'WHERE LOWER(descripcion) LIKE ?';
    params.push(`%${q.toLowerCase()}%`);
  }

  const [rows] = await pool.execute(
    `SELECT id, descripcion
     FROM ciclos_formativos
     ${where}
     ORDER BY descripcion ASC`,
    params
  );

  return rows;
};
