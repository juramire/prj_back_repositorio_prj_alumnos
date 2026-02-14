-- Esquema completo para MySQL 8.x
-- Ejecuta: mysql -u <user> -p < scripts/sql/schema.sql

DROP DATABASE IF EXISTS `repositorio_fct`;
CREATE DATABASE `repositorio_fct` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `repositorio_fct`;

CREATE TABLE ciclos_formativos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('user','profesor','admin') NOT NULL DEFAULT 'user',
  ciclo_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_ciclo (ciclo_id),
  CONSTRAINT fk_users_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_formativos(id)
);

CREATE TABLE proyectos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT NOT NULL,
  ciclo_id INT NOT NULL,
  curso_academico VARCHAR(20) NOT NULL,
  tags TEXT NOT NULL,
  alumnos TEXT NOT NULL,
  status ENUM('NOT_SEND','SUBMITTED','PUBLISHED') NOT NULL DEFAULT 'NOT_SEND',
  video_url VARCHAR(500) NULL,
  pdf_urls JSON NULL,
  last_modified_by INT NULL,
  last_modified_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  submitted_at DATETIME NULL,
  published_at DATETIME NULL,
  CONSTRAINT fk_proyectos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_proyectos_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_formativos(id),
  CONSTRAINT fk_proyectos_last_modified_by FOREIGN KEY (last_modified_by) REFERENCES users(id),
  INDEX idx_title (title),
  INDEX idx_curso (curso_academico),
  INDEX idx_ciclo (ciclo_id),
  INDEX idx_status (status),
  FULLTEXT INDEX ft_proyectos (title, descripcion, resumen, tags)
);

CREATE TABLE incidencias (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('ABIERTA','EN_PROGRESO','RESUELTA','DESCARTADA') NOT NULL DEFAULT 'ABIERTA',
  contexto VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_incidencias_user (user_id),
  INDEX idx_incidencias_estado (estado),
  CONSTRAINT fk_incidencias_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE proyectos_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id BIGINT NOT NULL,
  user_id INT NULL,
  action ENUM('CREATE','UPDATE','DELETE','STATUS_CHANGE') NOT NULL,
  diff JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ph_proyecto (proyecto_id),
  INDEX idx_ph_user (user_id),
  CONSTRAINT fk_ph_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  CONSTRAINT fk_ph_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Usuario administrador de ejemplo (sustituye <hash> por un bcrypt real)
-- INSERT INTO users (name, email, password_hash, rol) VALUES
-- ('Profesor Demo', 'profesor@example.com', '<hash>', 'profesor'),
-- ('Admin Demo', 'admin@example.com', '<hash>', 'admin');
-- "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoicHJvZmVzb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwibmFtZSI6IkFkbWluIiwiaWF0IjoxNzcxMTA4MjI3LCJleHAiOjE3NzExMTU0Mjd9.gckptscakyi9DXpRdLWHBNmWLrdy3YOcrZ7cnntkMAc"