# Gap Analysis — EduVerify vs Udemy/YouTube

Comparativa de funcionalidad tras la migración al backend REST, y qué se implementó en la fase "Cursos".

---

## Comparativa

| Funcionalidad | Udemy | YouTube | EduVerify (antes) | EduVerify (ahora) |
|---|---|---|---|---|
| Catálogo de videos | ✅ | ✅ | ✅ | ✅ |
| Canales/perfiles públicos | ✅ | ✅ | ✅ | ✅ |
| Suscripciones | — | ✅ | ✅ | ✅ |
| Comentarios con likes/respuestas | ✅ | ✅ | ✅ | ✅ |
| Favoritos / historial / playlists de alumno | parcial | ✅ | ✅ | ✅ |
| **Cursos estructurados (lecciones ordenadas)** | ✅ | parcial (playlists) | ❌ (`orden` sin usar) | ✅ `/api/cursos/:id` |
| **Inscripción a cursos** | ✅ | — | ❌ | ✅ `course_enrollments` |
| **Progreso por lección + %** | ✅ | parcial | ❌ | ✅ `lesson_progress` |
| **Ratings y reseñas (1–5 ★)** | ✅ | 👍/👎 | ❌ | ✅ `course_reviews` (requiere inscripción) |
| **Asistente/tutor IA sobre la clase** | ✅ (beta) | — | ❌ | ✅ `POST /api/ai/chat` (Gemini) |
| Búsqueda real | ✅ | ✅ | ❌ (Navbar decorativo) | ❌ backlog |
| Likes de video | — | ✅ | ❌ (solo comentarios) | ❌ backlog |
| Notificar suscriptores al publicar | ✅ | ✅ | ❌ (solo al suscribirse) | ❌ backlog |
| Gating premium real | ✅ | ✅ (Premium) | ⚠️ `es_premium` no se valida al reproducir | ❌ backlog |
| Paginación en catálogo UI | ✅ | ✅ (infinite scroll) | ⚠️ API pagina, UI carga 50 fijos | ❌ backlog |
| Duración automática del video | ✅ | ✅ | ❌ (string manual `00:00`) | ❌ backlog |
| Progreso de reproducción en segundos | ✅ | ✅ | ❌ | ❌ backlog |
| Certificados de finalización | ✅ | — | ❌ | ❌ backlog |
| Streaming de respuesta del chat IA | ✅ | — | ❌ | ❌ backlog (respuesta completa por request) |

---

## Implementado en esta fase

1. **Cursos** = `profesor_playlists` extendida (+`descripcion`) con lecciones ordenadas (`orden` ahora se usa y es reordenable vía `PUT /api/profesor/playlists/:id/orden`). Detalle público en `/api/cursos/:id`; vista `curso` (`CursoDetalle.jsx`) y `mis-cursos` (`MisCursos.jsx`).
2. **Inscripción y progreso**: `course_enrollments` + `lesson_progress`; % calculado con JOIN contra las lecciones actuales (lecciones eliminadas no inflan el porcentaje).
3. **Reseñas 1–5 ★** con texto opcional; una por usuario/curso (upsert); requieren inscripción (403 si no).
4. **Tutor IA** con Google Gemini (`@google/genai`, `GEMINI_API_KEY`, modelo `AI_MODEL` default `gemini-2.5-flash`); pestaña "Tutor IA" junto a Comentarios en el Reproductor.

## Backlog priorizado

| # | Ítem | Nota |
|---|---|---|
| 1 | Búsqueda real | El input del Navbar no filtra nada; falta `GET /api/videos?q=` + UI |
| 2 | Gating premium | `es_premium` se muestra pero cualquier usuario puede reproducir el video |
| 3 | Notificar suscriptores al publicar video | Hoy solo se notifica al suscribirse |
| 4 | Likes de video | Solo existen likes de comentarios |
| 5 | Paginación/infinite scroll en catálogo | El API ya pagina; la UI pide `limit=50` fijo |
| 6 | Duración automática | Extraer del video/YouTube en vez de string manual |
| 7 | Progreso de reproducción en segundos | Reanudar donde se quedó |
| 8 | Certificados al completar curso | PDF/imagen al llegar a 100% |
| 9 | Streaming del chat IA | SSE para respuestas token a token |
| 10 | Rate limit distribuido para `/api/ai/chat` | El actual es in-memory por proceso (MVP) |
