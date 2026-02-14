-- Seed mínimo para probar histórico de proyectos
-- Asegúrate de tener bcrypt reales antes de usarlo en autenticación.

USE `repositorio_fct`;

-- Ciclo formativo de prueba
INSERT INTO ciclos_formativos (descripcion) VALUES ('Administración de Sistemas Informáticos en Red')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- Usuarios de prueba (sustituye <hash> por bcrypt reales)
INSERT INTO users (name, email, password_hash, rol, ciclo_id) VALUES
  ('Usuario Demo', 'user@example.com', '<hash_user>', NULL, NULL),
  ('Profesor Demo', 'profesor@example.com', '<hash_prof>', NULL, NULL),
  ('Admin Demo', 'admin@example.com', '<hash_admin>', NULL, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), rol = VALUES(rol);

-- IDs auxiliares
SET @ciclo_id = (SELECT id FROM ciclos_formativos LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1);
SET @prof_id = (SELECT id FROM users WHERE email = 'profesor@example.com' LIMIT 1);
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1);

-- Proyecto inicial (creado por el usuario)
INSERT INTO proyectos (user_id, title, descripcion, resumen, ciclo_id, curso_academico, tags, alumnos, status, video_url, pdf_urls, last_modified_by, last_modified_at, created_at, updated_at)
VALUES (
  @user_id,
  'Proyecto Demo',
  'Descripción inicial',
  'Resumen inicial',
  @ciclo_id,
  '2025/26',
  'node, express',
  'Bruno Estudiante, Ana Alumna',
  'NOT_SEND',
  NULL,
  JSON_ARRAY(),
  @user_id,
  NOW(),
  NOW(),
  NOW()
);
SET @proy_id = LAST_INSERT_ID();

-- Histórico: creación
INSERT INTO proyectos_history (proyecto_id, user_id, action, diff)
VALUES (@proy_id, @user_id, 'CREATE', JSON_OBJECT('after', JSON_OBJECT('status','NOT_SEND','title','Proyecto Demo')));

-- Simular actualización por el profesor
UPDATE proyectos
   SET title = 'Proyecto Demo v2',
       descripcion = 'Descripción revisada por profesor',
       status = 'SUBMITTED',
       submitted_at = NOW(),
       last_modified_by = @prof_id,
       last_modified_at = NOW(),
       updated_at = NOW()
 WHERE id = @proy_id;

INSERT INTO proyectos_history (proyecto_id, user_id, action, diff)
VALUES (@proy_id, @prof_id, 'UPDATE',
        JSON_OBJECT('title', JSON_OBJECT('before','Proyecto Demo','after','Proyecto Demo v2'),
                    'status', JSON_OBJECT('before','NOT_SEND','after','SUBMITTED')));

-- Simular publicación por admin
UPDATE proyectos
   SET status = 'PUBLISHED',
       published_at = NOW(),
       last_modified_by = @admin_id,
       last_modified_at = NOW(),
       updated_at = NOW()
 WHERE id = @proy_id;

INSERT INTO proyectos_history (proyecto_id, user_id, action, diff)
VALUES (@proy_id, @admin_id, 'STATUS_CHANGE',
        JSON_OBJECT('status', JSON_OBJECT('before','SUBMITTED','after','PUBLISHED')));

-- Consulta rápida para validar
SELECT p.id, p.title, p.status, p.last_modified_by, p.last_modified_at FROM proyectos p WHERE p.id = @proy_id;
SELECT * FROM proyectos_history WHERE proyecto_id = @proy_id ORDER BY created_at;
