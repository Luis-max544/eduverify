# EduVerify Backend

API REST para EduVerify. Node.js + Express + MySQL (Drizzle ORM).

## Stack

- **Express 4** — servidor HTTP / routing
- **MySQL 8** + **Drizzle ORM** (`drizzle-orm`, `mysql2`) — persistencia
- **JWT** (`jsonwebtoken`) — autenticación stateless
- **bcrypt** — hash de contraseñas
- **multer** — subida de avatares/banners
- **nodemailer** — envío de emails de recuperación de contraseña
- **zod** — validación de request bodies/params
- **Google OAuth** — verificación de credential JWT emitido por Google Identity Services

## Setup

```bash
cd backend
docker-compose up -d        # MySQL en :3306 + Adminer en :8080
cp .env.example .env        # completar valores (ver tabla abajo)
pnpm install
pnpm db:migrate
pnpm dev                    # http://localhost:3001
```

## Scripts

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor con `--watch` (auto-reload) |
| `pnpm start` | Servidor en modo producción |
| `pnpm db:generate` | Genera migraciones Drizzle a partir de `src/db/schema.js` |
| `pnpm db:migrate` | Aplica migraciones pendientes contra la DB |
| `pnpm db:studio` | Abre Drizzle Studio (explorador visual de la DB) |

No hay suite de tests ni linter configurado para el backend.

## Variables de entorno

Ver `.env.example`. Las marcadas como requeridas hacen fallar el arranque (`src/config/env.js`) si faltan.

| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | no (default 3001) | Puerto del servidor |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | sí | Conexión MySQL |
| `JWT_SECRET` | sí | Secreto para firmar/verificar tokens (mín. 32 chars) |
| `GOOGLE_CLIENT_ID` | no | Client ID de Google usado para validar el `credential` de `/api/auth/google` |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | no | SMTP para el email de reseteo de contraseña |
| `FRONTEND_URL` | no (default `http://localhost:5173`) | Origen permitido por CORS y usado en el link del email de reseteo |

## Arquitectura

```
src/
├── index.js          # entrypoint: monta middlewares y routers, sirve /uploads
├── config/
│   ├── env.js         # carga y valida process.env
│   └── db.js          # conexión Drizzle/mysql2
├── db/
│   ├── schema.js       # definición de tablas y relaciones Drizzle
│   └── migrations/      # migraciones generadas por drizzle-kit
├── middleware/
│   ├── auth.js         # verifyToken, requireRol(...roles)
│   ├── upload.js       # multer config para avatar/banner
│   └── errorHandler.js # traduce ZodError/multer/genérico a { status, message }
├── routes/            # un router por recurso, montado en index.js bajo /api/*
└── services/
    ├── email.js         # nodemailer — envío de reset de password
    └── google.js         # verificación de credential de Google OAuth
```

Todas las rutas se montan bajo `/api/*` en `src/index.js`. El detalle completo de cada endpoint (métodos, params, auth, respuestas) está en [`openapi.yaml`](./openapi.yaml).

## Modelo de datos

Definido en `src/db/schema.js`:

- **users** — cuenta (`rol`: `estudiante` | `profesor` | `creador`; `premium` boolean)
- **reset_tokens** — tokens de un solo uso para reseteo de password
- **videos** — contenido, referencia `usuario_id` (autor)
- **comments** / **comment_likes** — comentarios anidados (self-referencing vía `parent_id`) + likes
- **playlists** / **playlist_videos** — playlists de estudiante
- **profesor_playlists** / **profesor_playlist_videos** — playlists de profesor (con `orden`)
- **subscriptions** — suscripción estudiante→profesor, con flag `notificaciones`
- **notifications** — notificaciones in-app por usuario
- **favorites**, **history** — favoritos e historial de reproducción por usuario

## Autenticación

- Header `Authorization: Bearer <token>`.
- El JWT se firma en `auth.js` (`signToken`) con payload `{ sub, email, rol, premium }` y expira en 7 días.
- Middleware `verifyToken` (`src/middleware/auth.js`) valida el token y puebla `req.user`.
- Middleware `requireRol(...roles)` restringe endpoints por `rol` (ej. crear video requiere `profesor` o `creador`).

## Convención de respuesta

Todos los endpoints devuelven:

```json
{ "status": "success", "data": { ... } }
```
o en error:
```json
{ "status": "error", "message": "..." }
```

`src/middleware/errorHandler.js` centraliza el mapeo de errores: `ZodError` → 400 con mensajes de validación concatenados, errores de tipo de archivo/tamaño de multer → 400, resto → `err.status || 500`.

## Uploads

Avatares y banners se guardan en `backend/uploads/{avatars,banners}/<userId>.<ext>` y se sirven estáticamente en `/uploads/...`. Restricciones (`src/middleware/upload.js`): solo JPEG/PNG/WebP, máx. 2MB (avatar) / 5MB (banner).

## API reference

Ver [`openapi.yaml`](./openapi.yaml) para la spec completa (39 endpoints). Se puede visualizar pegando el archivo en [Swagger Editor](https://editor.swagger.io) o importándolo en Postman/Insomnia.
