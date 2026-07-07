# Courses Specification — EduVerify

Cursos estilo Udemy construidos sobre `profesor_playlists` (no hay tabla `courses` nueva): una playlist de profesor **es** un curso; sus videos ordenados son las lecciones.

---

## Schema

### `profesor_playlists` (extendida)

| Columna | Tipo | Nota |
|---|---|---|
| `descripcion` | `text` NULL | nueva; editable vía `PATCH /api/profesor/playlists/:id` |

### `course_enrollments`

| Columna | Tipo | Claves |
|---|---|---|
| `user_id` | int FK → users (cascade) | PK compuesta |
| `playlist_id` | int FK → profesor_playlists (cascade) | PK compuesta, idx |
| `enrolled_at` | timestamp defaultNow | |

### `lesson_progress`

| Columna | Tipo | Claves |
|---|---|---|
| `user_id` | int FK → users (cascade) | PK compuesta |
| `playlist_id` | int FK → profesor_playlists (cascade) | PK compuesta |
| `video_id` | int FK → videos (cascade) | PK compuesta |
| `completed_at` | timestamp defaultNow | |

**Cálculo de `porcentaje`**: `lesson_progress` se cruza (JOIN) con `profesor_playlist_videos` actual — si el profesor elimina una lección, las filas huérfanas de progreso no cuentan ni inflan el %.

---

## Endpoints `/api/cursos` (`backend/src/routes/cursos.js`)

⚠️ Orden de rutas Express: `/mis-cursos` está registrada **antes** de `/:id`.

| Método | Ruta | Auth | data |
|---|---|---|---|
| GET | `/api/cursos/mis-cursos` | JWT | `[{id, nombre, descripcion, autor, autor_id, author_avatar_url, enrolled_at, completadas, total_lecciones, porcentaje, promedio_estrellas, total_reviews}]` |
| GET | `/api/cursos/:id` | pública | `{id, nombre, descripcion, created_at, autor:{id,nombre,avatar_url}, lecciones[], total_lecciones, inscritos, promedio_estrellas, total_reviews}` |
| GET | `/api/cursos/:id/progreso` | JWT | `{inscrito, completadas:[video_id], porcentaje}` |
| POST | `/api/cursos/:id/inscripcion` | JWT | `{message}` — upsert idempotente |
| DELETE | `/api/cursos/:id/inscripcion` | JWT | `{message}` — borra también `lesson_progress` del usuario |
| POST | `/api/cursos/:id/lecciones/:videoId/completar` | JWT | `{porcentaje}` — verifica inscripción + pertenencia del video (403/404) |
| DELETE | `/api/cursos/:id/lecciones/:videoId/completar` | JWT | `{porcentaje}` |

`lecciones[]` sigue el shape de video del catálogo + `orden`, ordenadas por `profesor_playlist_videos.orden`.

### Rutas nuevas en `/api/profesor/playlists`

| Método | Ruta | Auth | Body |
|---|---|---|---|
| PATCH | `/:id` | owner | `{nombre?, descripcion?}` (≥1 campo) |
| PUT | `/:id/orden` | owner | `{orden: [videoId,...]}` — debe incluir exactamente los videos de la playlist; updates por par (PK compuesta), no delete+insert |

`GET /api/profesor/playlists[/public/:userId]` ahora incluye `descripcion`, `promedio_estrellas` y `total_reviews` (agregado en una sola query agrupada, merge en memoria).

---

## Frontend

| Pieza | Contrato |
|---|---|
| `api.js` → `cursos.*` | `get, misCursos, progreso, inscribir, desinscribir, completarLeccion, descompletarLeccion, reviews, upsertReview, removeReview` |
| `api.js` → `profesorPlaylists` | `rename` → `update(id, {nombre, descripcion})`; nuevo `reorder(id, ordenIds)` |
| `App.jsx` | estados `cursoSeleccionado` / `cursoActivo`; `abrirCurso(id)` → vista `curso`; `abrirLeccionDeCurso(video, cursoId)` → reproductor con contexto; `seleccionarYRegistrarVideo` limpia `cursoActivo` |
| `CursoDetalle.jsx` | fetch propio (`cursos.get/progreso/reviews`); header con ★, barra %, botón Inscribirse/Continuar (primera lección no completada); lista de lecciones con ✓; sección de reseñas |
| `MisCursos.jsx` | vista `mis-cursos` (Sidebar 🎓); grid con % y botón Continuar |
| `Reproductor.jsx` | con `cursoActivoId`: barra de curso (Marcar completada / Siguiente lección), sidebar de lecciones con ✓ y lección actual resaltada |
| `Canal.jsx` | card de playlist → `abrirCurso(id)`, muestra ★ y descripción truncada |
| `PanelProfesor.jsx` | "Gestionar curso": textarea de descripción + flechas ↑↓ que llaman `reorder` |
