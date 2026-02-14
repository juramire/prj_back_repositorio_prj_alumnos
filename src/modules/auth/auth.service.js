import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { toUserDTO } from '../../utils/dto-mapper.js';

export const findUserByEmail = async email => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.rol, u.ciclo_id, c.descripcion AS ciclo_formativo, u.password_hash
     FROM users u
     LEFT JOIN ciclos_formativos c ON c.id = u.ciclo_id
     WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows[0];
};

export const findUserById = async id => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.rol, u.ciclo_id, c.descripcion AS ciclo_formativo
     FROM users u
     LEFT JOIN ciclos_formativos c ON c.id = u.ciclo_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
};

export const login = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const token = jwt.sign({ id: user.id, rol: user.rol, email: user.email, name: user.name }, config.jwtSecret, {
    expiresIn: '2h'
  });
  return { token, user: toUserDTO(user) };
};
