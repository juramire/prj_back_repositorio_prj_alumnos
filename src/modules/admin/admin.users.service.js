import bcrypt from 'bcryptjs';
import mysql from 'mysql2';
import { pool } from '../../db/pool.js';
import { parsePagination } from '../../utils/pagination.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { toUserDTO } from '../../utils/dto-mapper.js';

const ALLOWED_ROLES = ['user', 'admin'];

const normalizeEmail = raw => sanitizeString(raw).toLowerCase();
const normalizeCiclo = raw => sanitizeString(raw);

const validateRole = rol => ALLOWED_ROLES.includes(rol);

const getUser = async id => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.rol, u.ciclo_id, c.descripcion AS ciclo_formativo
     FROM users u
     LEFT JOIN ciclos_formativos c ON c.id = u.ciclo_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
};

const findCicloId = async cicloInput => {
  if (cicloInput === undefined || cicloInput === null) return null;
  const num = Number(cicloInput);
  if (Number.isInteger(num) && num > 0) return num;
  const desc = normalizeCiclo(cicloInput);
  if (!desc) return null;
  const [rows] = await pool.execute(
    'SELECT id FROM ciclos_formativos WHERE LOWER(descripcion) = ? LIMIT 1',
    [desc.toLowerCase()]
  );
  return rows[0]?.id ?? null;
};

export const listUsers = async query => {
  const { page, pageSize, offset } = parsePagination(query, { page: 1, pageSize: 10, maxPageSize: 100 });
  const whereParts = ['1=1'];
  const params = [];

  const rol = sanitizeString(query.rol).toLowerCase();
  if (rol && validateRole(rol)) {
    whereParts.push('u.rol = ?');
    params.push(rol);
  }

  const ciclo = normalizeCiclo(query.ciclo);
  const cicloId = Number.isInteger(Number(query.cicloId)) ? Number(query.cicloId) : null;
  if (cicloId) {
    whereParts.push('u.ciclo_id = ?');
    params.push(cicloId);
  } else if (ciclo) {
    whereParts.push('LOWER(c.descripcion) = ?');
    params.push(ciclo.toLowerCase());
  }

  const q = sanitizeString(query.q);
  if (q) {
    const like = `%${q}%`;
    whereParts.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(like, like);
  }

  const where = `WHERE ${whereParts.join(' AND ')}`;

  const sqlList = mysql.format(
    `SELECT u.id, u.name, u.email, u.rol, u.ciclo_id, c.descripcion AS ciclo_formativo, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN ciclos_formativos c ON c.id = u.ciclo_id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [rows] = await pool.query(sqlList);

  const sqlCount = mysql.format(`SELECT COUNT(*) as total FROM users u LEFT JOIN ciclos_formativos c ON c.id=u.ciclo_id ${where}`, params);
  const [[{ total }]] = await pool.query(sqlCount);

  return { items: rows.map(toUserDTO), total, page, pageSize };
};

export const getUserById = async id => getUser(id);

export const createUser = async body => {
  const name = sanitizeString(body?.name);
  const email = normalizeEmail(body?.email);
  const password = body?.password ?? '';
  const rol = (sanitizeString(body?.rol) || 'user').toLowerCase();
  const cicloInput = body?.cicloId ?? body?.ciclo ?? body?.ciclo_formativo ?? body?.cicloFormativo;

  if (!name || !email || !password) {
    const err = new Error('name, email y password son obligatorios');
    err.status = 400;
    throw err;
  }
  if (!validateRole(rol)) {
    const err = new Error('Rol inválido');
    err.status = 400;
    throw err;
  }
  const cicloId = await findCicloId(cicloInput);
  if (!cicloId) {
    const err = new Error('ciclo es obligatorio');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, rol, ciclo_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, rol, cicloId]
    );
    return getUser(result.insertId);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      const err = new Error('Email ya existe');
      err.status = 400;
      throw err;
    }
    throw e;
  }
};

export const updateUser = async (id, body) => {
  const current = await getUser(id);
  if (!current) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  const fields = [];
  const params = [];
  let cicloIdUpdate;

  if (body?.name !== undefined) {
    const name = sanitizeString(body.name);
    if (!name) {
      const err = new Error('Nombre no puede estar vacío');
      err.status = 400;
      throw err;
    }
    fields.push('name = ?');
    params.push(name);
  }

  if (body?.email !== undefined) {
    const email = normalizeEmail(body.email);
    if (!email) {
      const err = new Error('Email no puede estar vacío');
      err.status = 400;
      throw err;
    }
    fields.push('email = ?');
    params.push(email);
  }

  if (body?.rol !== undefined) {
    const rol = sanitizeString(body.rol).toLowerCase();
    if (!validateRole(rol)) {
      const err = new Error('Rol inválido');
      err.status = 400;
      throw err;
    }
    fields.push('rol = ?');
    params.push(rol);
  }

  if (body?.ciclo !== undefined || body?.cicloId !== undefined || body?.ciclo_formativo !== undefined || body?.cicloFormativo !== undefined) {
    const cicloId = await findCicloId(body.ciclo ?? body.cicloId ?? body.ciclo_formativo ?? body.cicloFormativo);
    if (!cicloId) {
      const err = new Error('ciclo es obligatorio');
      err.status = 400;
      throw err;
    }
    fields.push('ciclo_id = ?');
    cicloIdUpdate = cicloId;
    params.push(cicloIdUpdate);
  }

  if (body?.password !== undefined) {
    if (!body.password) {
      const err = new Error('Password no puede estar vacío');
      err.status = 400;
      throw err;
    }
    const hash = await bcrypt.hash(body.password, 10);
    fields.push('password_hash = ?');
    params.push(hash);
  }

  const effectiveCicloId =
    body?.ciclo !== undefined || body?.cicloId !== undefined || body?.ciclo_formativo !== undefined || body?.cicloFormativo !== undefined
      ? cicloIdUpdate
      : current.ciclo_id;
  if (!effectiveCicloId) {
    const err = new Error('ciclo es obligatorio');
    err.status = 400;
    throw err;
  }

  if (!fields.length) {
    const err = new Error('Nada para actualizar');
    err.status = 400;
    throw err;
  }

  params.push(id);
  try {
    const [result] = await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }
    return getUser(id);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      const err = new Error('Email ya existe');
      err.status = 400;
      throw err;
    }
    throw e;
  }
};

export const deleteUser = async id => {
  const [[{ cnt }]] = await pool.execute('SELECT COUNT(*) as cnt FROM proyectos WHERE user_id = ?', [id]);
  if (cnt > 0) {
    const err = new Error('No se puede borrar: el usuario tiene proyectos asociados');
    err.status = 409;
    throw err;
  }
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
};

const parseCsvLine = line => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
};

const maybeSkipHeader = lineFields => {
  const header = lineFields.map(f => f.trim().toLowerCase());
  const base =
    header[0] === 'name' && header[1] === 'email' && header[2] === 'password' && header[3] === 'rol';
  if (!base) return false;
  if (header.length >= 5 && header[4] === 'ciclo') return true;
  if (header.length === 4) return true;
  return false;
};

export const importUsers = async fileBuffer => {
  const text = fileBuffer.toString('utf8');
  const lines = text.split(/\r?\n/);
  let total = 0;
  let created = 0;
  let skipped = 0;
  const errors = [];
  let firstContentSeen = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    if (!rawLine || !rawLine.trim()) continue;
    const fields = parseCsvLine(rawLine);

    // Skip header once
    if (!firstContentSeen && maybeSkipHeader(fields)) {
      firstContentSeen = true;
      continue;
    }
    firstContentSeen = true;
    total++;

    const [rawName, rawEmail, rawPassword, rawRol, rawCiclo] = fields;
    const name = sanitizeString(rawName);
    const email = normalizeEmail(rawEmail);
    const password = rawPassword ?? '';
    const rol = sanitizeString(rawRol || 'user').toLowerCase();
    const cicloId = await findCicloId(rawCiclo);

    if (!name || !email || !password) {
      errors.push({ line: idx + 1, message: 'Campos requeridos faltantes' });
      skipped++;
      continue;
    }
    if (!validateRole(rol)) {
      errors.push({ line: idx + 1, message: 'Rol inválido' });
      skipped++;
      continue;
    }
    if (!cicloId) {
      errors.push({ line: idx + 1, message: 'ciclo es obligatorio' });
      skipped++;
      continue;
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      await pool.execute('INSERT INTO users (name, email, password_hash, rol, ciclo_id) VALUES (?, ?, ?, ?, ?)', [
        name,
        email,
        hash,
        rol,
        rol === 'admin' ? null : cicloId
      ]);
      created++;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        errors.push({ line: idx + 1, message: 'Email duplicado' });
        skipped++;
        continue;
      }
      throw e;
    }
  }

  return { total, created, skipped, ...(errors.length ? { errors } : {}) };
};
