# Course Reviews Specification — EduVerify

Reseñas 1–5 estrellas por curso, una por usuario (upsert), con texto opcional. Requieren inscripción.

---

## Schema — `course_reviews`

| Columna | Tipo | Claves / validación |
|---|---|---|
| `id` | int PK AI | |
| `playlist_id` | int FK → profesor_playlists (cascade) | idx |
| `user_id` | int FK → users (cascade) | `unique(user_id, playlist_id)` |
| `estrellas` | int NOT NULL | zod `1..5` (sin CHECK en DB, consistente con el codebase) |
| `texto` | text NULL | zod max 5000 |
| `created_at` / `updated_at` | timestamp | `updated_at` onUpdateNow |

---

## Endpoints (en `backend/src/routes/cursos.js`)

| Método | Ruta | Auth | Body | data |
|---|---|---|---|---|
| GET | `/api/cursos/:id/reviews` | pública | — | `{items:[{id, user_id, nombre, avatar_url, estrellas, texto, created_at}], promedio, total}` |
| PUT | `/api/cursos/:id/reviews` | JWT + **inscrito** | `{estrellas: 1-5, texto?}` | fila de la reseña (upsert vía `ON DUPLICATE KEY UPDATE`) |
| DELETE | `/api/cursos/:id/reviews` | JWT | — | `{message}` — borra solo la propia |

Reglas:

- `PUT` sin inscripción → **403** `"Debes inscribirte en el curso para dejar una reseña"`.
- `promedio` = `AVG(estrellas)` redondeado a 1 decimal; `null` si no hay reseñas.
- El promedio/total también se expone en `GET /api/cursos/:id` (`promedio_estrellas`, `total_reviews`) y en las playlists públicas del canal.

---

## Frontend

- **`CursoDetalle.jsx`**: sección "Reseñas" — lista pública siempre visible; formulario (5 estrellas clicables + textarea) solo si `progreso.inscrito`. Si el usuario ya reseñó, el form precarga su reseña (modo editar) y muestra botón Eliminar.
- **`api.js`**: `cursos.reviews(id)`, `cursos.upsertReview(id, {estrellas, texto})`, `cursos.removeReview(id)`.
- ★ promedio visible en: header del curso, cards de `MisCursos` y cards de playlist en `Canal`.
