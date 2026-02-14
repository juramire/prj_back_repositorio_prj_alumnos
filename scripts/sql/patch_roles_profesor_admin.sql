-- Parche: nuevo rol profesor y rol admin separado
-- 1) Actualiza el ENUM de roles
ALTER TABLE users MODIFY rol ENUM('user','profesor','admin') NOT NULL DEFAULT 'user';

-- 2) Promociona admins actuales a profesor (para preservar permisos previos)
UPDATE users SET rol = 'profesor' WHERE rol = 'admin';

-- 3) (Opcional) Crea un admin real. Sustituye <hash> por bcrypt real.
-- INSERT INTO users (name, email, password_hash, rol)
-- VALUES ('Admin', 'admin@example.com', '<hash>', 'admin');

-- Nota: ejecutar antes de aplicar cambios de permisos en backend.
