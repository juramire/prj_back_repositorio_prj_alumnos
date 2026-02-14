-- Parche seguro: flujo NOT_SEND -> SUBMITTED -> PUBLISHED
-- Orden pensado para evitar "Data truncated" al cambiar el ENUM
USE `repositorio_fct`;

-- 0) Diagnóstico (opcional)
-- SELECT DISTINCT status FROM proyectos;

-- 1) Ampliar ENUM temporalmente para que admita DRAFT y NOT_SEND a la vez
ALTER TABLE proyectos
  MODIFY status ENUM('DRAFT','NOT_SEND','SUBMITTED','PUBLISHED') NOT NULL DEFAULT 'NOT_SEND';

-- 2) Migrar datos antiguos DRAFT -> NOT_SEND
UPDATE proyectos SET status = 'NOT_SEND' WHERE status = 'DRAFT';

-- 3) (Opcional) Normalizar valores no esperados
UPDATE proyectos SET status = 'NOT_SEND' WHERE status NOT IN ('NOT_SEND','SUBMITTED','PUBLISHED');

-- 4) Reducir ENUM definitivo sin DRAFT
ALTER TABLE proyectos
  MODIFY status ENUM('NOT_SEND','SUBMITTED','PUBLISHED') NOT NULL DEFAULT 'NOT_SEND';

-- 5) Comprobación
-- SELECT DISTINCT status FROM proyectos;
