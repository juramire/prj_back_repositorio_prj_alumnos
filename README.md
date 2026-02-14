<<<<<<< HEAD
# prj_back_repositorio_prj_alumnos
Backend para pruebas del front en proyecto intermodular
=======
# Backend Repositorio FCT

API en Node.js + Express + MySQL que satisface las rutas consumidas por el frontend Angular (api.service.ts).

## Requisitos
- Node.js LTS (>=18)
- MySQL 8

## Configuración rápida
1) Instala dependencias  
```
npm install
```
2) Crea el archivo `.env` basado en `.env.example` ajustando credenciales y `ALLOWED_ORIGINS` (p.ej. `http://localhost:4200`).  
3) Prepara la base de datos ejecutando el SQL inicial:  
```
mysql -u <user> -p < scripts/sql/init.sql
```
4) Crea un usuario (ej. admin). Genera el hash con Node:  
```
node -e "import('bcryptjs').then(b=>b.default.hash('admin123',10).then(h=>console.log(h)))"
```
Inserta usando el hash:  
```
INSERT INTO users (name,email,password_hash,rol) VALUES ('Admin','admin@example.com','<hash>','admin');
```
5) Arranca el servidor  
```
npm run dev   # hot reload con --watch
```
La API quedará en `http://localhost:3000/api` y los ficheros estáticos en `http://localhost:3000/uploads`.

## Estructura
- `src/index.js` arranque y middlewares (CORS, helmet, rate limit, logs).
- `src/config` configuración env y logger.
- `src/db/pool.js` pool mysql2/promise reutilizable.
- `src/modules/*` rutas por dominio: auth, proyectos (público + usuario), admin, uploads, health.
- `uploads/` almacenamiento local de vídeo/PDF (servido como estático).

## Rutas principales (todas devuelven JSON)
- `POST /api/auth/login {email,password} -> {token,user}`
- `GET /api/auth/me`
- Público:  
  - `GET /api/proyectos?curso&ciclo&q&page&pageSize` -> `PagedResult<ProyectoPublicDTO>`  
  - `GET /api/proyectos/:id`
- Usuario autenticado (Bearer):  
  - `GET /api/proyectos/mio`  
  - `POST /api/proyectos` (status inicial `DRAFT`)  
  - `PUT /api/proyectos/:id` (solo dueño, no `PUBLISHED`)  
  - `DELETE /api/proyectos/:id` (solo dueño, no `PUBLISHED`)  
  - `POST /api/proyectos/:id/enviar` -> `status SUBMITTED`
- Uploads (Bearer):  
  - `POST /api/uploads/proyecto/:id` multipart `video` (opcional) + `pdfs[]`; máximo total 30 MB; responde `{videoUrl?, pdfUrls[]}`.
- Admin (Bearer rol admin):  
  - `GET /api/admin/proyectos?curso&ciclo&q&status&page&pageSize`  
  - `GET /api/admin/proyectos/:id`  
  - `PUT /api/admin/proyectos/:id` (puede editar contenido y `status`)  
  - `POST /api/admin/proyectos/:id/publicar` -> `status PUBLISHED`
- Salud: `GET /api/health`

## Validaciones y reglas
- Campos requeridos: `title, descripcion, resumen, cicloFormativo, cursoAcademico`.
- `tags`: máximo 5, sin duplicados (case-insensitive), se guardan saneados.
- Paginación 1-based (`page`, `pageSize`), con límite de `pageSize` 50.
- Seguridad: helmet, CORS configurable, rate-limit por IP, body limit 1 MB, JWT Bearer, desactivado `x-powered-by`.
- Borrado/edición prohibido si el proyecto está `PUBLISHED` (para usuarios).
- Todas las fechas se devuelven en ISO string.

## Notas
- Si cambias `FILE_UPLOAD_DIR`, asegúrate de que existe o que el proceso puede crearlo.
- Para producción, sirve `uploads/` detrás de un CDN o bucket si lo prefieres; ajusta `API_BASE_URL` para que los enlaces sean públicos.
- Manejo de errores: JSON plano `{message}` con códigos 400/401/403/404/500; logs estructurados a stdout.
>>>>>>> dbf7912 (Proyecto inicial: backend repositorio alumnos)
