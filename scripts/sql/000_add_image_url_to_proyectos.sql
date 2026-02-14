-- Añade columna image_url a la tabla proyectos
ALTER TABLE proyectos
  ADD COLUMN image_url VARCHAR(500) NULL AFTER video_url;
