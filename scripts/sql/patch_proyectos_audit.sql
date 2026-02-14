-- Parche opcional: auditoría de proyectos
-- Ejecutar tras revisar. Compatible con MySQL 8.x
-- Añade campos ligeros y tabla de histórico.

USE `repositorio_fct`;

-- 1) Campos ligeros en la tabla principal (idempotente, sin IF NOT EXISTS por compatibilidad)
SET @has_lmb := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'proyectos' AND column_name = 'last_modified_by'
);
SET @sql_lmb := IF(
  @has_lmb = 0,
  'ALTER TABLE proyectos ADD COLUMN last_modified_by INT NULL AFTER pdf_urls',
  'SELECT 1'
);
PREPARE stmt FROM @sql_lmb;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_lma := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'proyectos' AND column_name = 'last_modified_at'
);
SET @sql_lma := IF(
  @has_lma = 0,
  'ALTER TABLE proyectos ADD COLUMN last_modified_at DATETIME NULL AFTER last_modified_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql_lma;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Añadir FK solo si no existe
SET @has_fk := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_proyectos_last_modified_by'
);
SET @sql := IF(
  @has_fk = 0,
  'ALTER TABLE proyectos ADD CONSTRAINT fk_proyectos_last_modified_by FOREIGN KEY (last_modified_by) REFERENCES users(id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Tabla de histórico de cambios
CREATE TABLE IF NOT EXISTS proyectos_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id BIGINT NOT NULL,
  user_id INT NULL, -- quién hizo el cambio (puede ser NULL si no se conoce)
  action ENUM('CREATE','UPDATE','DELETE','STATUS_CHANGE') NOT NULL,
  diff JSON NULL, -- guardar before/after o lista de campos cambiados
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ph_proyecto (proyecto_id),
  INDEX idx_ph_user (user_id),
  CONSTRAINT fk_ph_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  CONSTRAINT fk_ph_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Nota: ejecutar estos ALTER en un entorno de prueba antes de producción.
