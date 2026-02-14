# Taller IA Backend Repositorio FCT

## Contexto
- Backend Node/Express (ES modules) con JWT (30 min), bcrypt, multer, mysql2.
- Esquema MySQL en `scripts/sql/schema.sql`: tablas `users`, `ciclos_formativos`, `proyectos`, `incidencias`.
- Endpoints previstos: auth (`/api/auth/login`, `/api/auth/me`), proyectos (CRUD + filtros + uploads PDFs), ciclos (catálogo), incidencias (crear/listar, admin cambia estado), health, `/uploads` estático.
- Roles: `user`, `admin`. Login por email+password; DTO sin hash.
- Middlewares: Helmet, CORS whitelist (`ALLOWED_ORIGINS`), rate limiting configurable, body limit 1 MB, morgan, static uploads.
- Uploads: PDFs (y archivos), guardados en `FILE_UPLOAD_DIR`, servidos en `/uploads`.
- Taller 4 h, prompts en español, enfoque pedagógico y por etapas; testing opcional con jest/supertest; docker-compose opcional.

## Prompts modelo (copiar en chat IA VSCode/Codex)
- Resumen inicial: generar pasos para backend Node/Express ES modules con JWT 30m, bcrypt, multer, mysql2; comandos npm y estructura de carpetas.
- `.env.example` + `src/config/env.js` validando DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, ALLOWED_ORIGINS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, FILE_UPLOAD_DIR.
- `src/db/pool.js` con mysql2/promise y ping al iniciar.
- Middlewares: Helmet, CORS whitelist, rateLimit, morgan, body JSON 1 MB, static uploads (crea carpeta).
- Auth: servicio login bcrypt + JWT 30m, rutas `/api/auth/login` y `/api/auth/me`, middlewares `requireAuth`/`requireAdmin`, DTO sin password.
- Ciclos: GET lista, POST crear (solo admin) usando `ciclos_formativos`.
- Proyectos: CRUD + filtros q (FULLTEXT), ciclo, curso, status; paginación page/pageSize; propiedad vs admin; campos del esquema; subida PDFs con multer y paths en `pdf_urls` JSON.
- Incidencias: crear ligada al user autenticado; listar propias; admin ve todas y puede actualizar estado.
- Health: `/api/health` simple; middleware de errores JSON.
- Seeds SQL con ciclos y usuario admin (hash bcrypt de “Admin123”).
- Tests: configurar jest/supertest; pruebas de login ok/ko y `/api/health`.
- Docker-compose: backend + MySQL 8, volúmenes para datos y uploads.

## Consejos de uso de IA en el taller
- Pedir respuestas con rutas y comandos claros; que explique cada archivo.
- Usar menos mensajes, más completos; reutilizar respuestas entre alumnos.
- Si hay límites de Copilot: activar trial por alumno o usar alternativas (Codeium/Continue, modelo local con Ollama/LM Studio). Mantener un chat para tareas iterativas; usar otro solo para tareas independientes.

## Uso de chats de IA y optimización de cuota
- Copilot Free: ~50 chats y 50 peticiones premium/mes; se agota rápido en un taller.
- Copilot Pro/Business/Enterprise: chat base ilimitado; las peticiones “premium” tienen cupo mensual (ej. Pro 300, Pro+ 1500). Al agotarlo, sigue el modelo base.
- Modelos en vista previa (ej. GPT‑4.5 preview) suelen tener topes más bajos (p.ej. 10 cada 12 h).
- Estrategias:
  - Activar trial de Copilot antes de la sesión o usar GitHub Education/Student Pack si aplica.
  - Instalar alternativas gratis: Codeium, Continue, Cursor (plan free) o montar un servidor local con Ollama/LM Studio y compartirlo.
  - Preparar prompts plantillas (los de arriba) para no gastar mensajes afinando.
  - Agrupar peticiones: pedir “todo el bloque de esta etapa” en un solo mensaje.
  - Compartir respuestas entre alumnos (doc común) y trabajar en parejas: uno chatea, otro ejecuta.
  - Usar chats distintos solo para tareas independientes (seeds vs tests); para iterar en un módulo, mantener el mismo chat para conservar contexto.
  - Si aparece límite premium, indicar “usa modelo base/no premium” en el prompt y reintentar tras unos minutos.

## Propuesta de auditoría (sin aplicar aún)
- Parche SQL en `scripts/sql/patch_proyectos_audit.sql`:
  - Añade `last_modified_by` (FK users) y `last_modified_at` a `proyectos`.
  - Crea tabla `proyectos_history` con `proyecto_id`, `user_id`, `action (CREATE/UPDATE/DELETE/STATUS_CHANGE)`, `diff JSON`, `created_at`.
- Helper opcional en `src/modules/proyectos/proyectos.history.js`:
  - `recordHistory({ proyectoId, userId, action, diff })` guarda una entrada.
  - `buildDiff(before, after)` devuelve solo campos cambiados.
- Cómo integrarlo (pendiente de decidir):
  1) Tras ALTER, actualizar servicios de proyectos para setear `last_modified_by/at` en create/update/delete/enviar.
  2) Llamar a `recordHistory` guardando `diff` entre estado anterior y nuevo.
  3) Endpoint admin opcional `/api/admin/proyectos/:id/history` para consultar el histórico.
## Notas rápidas
- CORS controla orígenes permitidos; rate limiting limita peticiones por IP/ventana para evitar abuso.
- Limpiar localStorage/sessionStorage en el front al probar login si hay tokens cacheados.
