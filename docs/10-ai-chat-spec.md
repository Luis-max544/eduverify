# AI Tutor Chat Specification — EduVerify

Tutor IA contextual a la clase que se está viendo, con **Google Gemini**. Convive con los comentarios en el Reproductor mediante pestañas `Comentarios | Tutor IA`.

---

## Configuración

| Variable | Default | Nota |
|---|---|---|
| `GEMINI_API_KEY` | `''` | backend/.env; **no requerida** — sin key el endpoint responde 503 |
| `AI_MODEL` | `gemini-2.5-flash` | configurable |

SDK: `@google/genai` (`backend/package.json`). Key gratuita: aistudio.google.com.

---

## Endpoint — `POST /api/ai/chat` (`backend/src/routes/ai.js`)

Auth: JWT. Body (zod):

```json
{
  "video_id": 123,
  "messages": [
    { "role": "user", "content": "¿De qué trata la clase?" }
  ]
}
```

Reglas de validación: 1–20 mensajes, `content` 1–4000 chars, roles `user|assistant`, primer **y** último mensaje con role `user`.

Respuesta: `{ status: 'success', data: { reply: "<texto del tutor>" } }`

### Errores

| Código | Caso | Mensaje |
|---|---|---|
| 503 | sin `GEMINI_API_KEY` | "El tutor IA no está configurado en este servidor" |
| 429 | rate limit local (10 req/min por usuario) | "Demasiadas solicitudes, espera un momento" |
| 429 | rate limit del proveedor | "El tutor IA está saturado, intenta en unos segundos" |
| 404 | `video_id` inexistente | "Video no encontrado" |
| 502 | cualquier otro error de Gemini | "El tutor IA no está disponible, intenta más tarde" |

### Implementación

- **System prompt** en español con `titulo`, `categoria`, `autor` y `descripcion` del video (fetch por `video_id`): "Eres un tutor educativo de EduVerify… responde breve, claro y pedagógico"; redirige preguntas fuera de tema.
- Mapeo de mensajes → `contents: [{role: 'user'|'model', parts:[{text}]}]`; `generateContent({model, contents, config: {systemInstruction, maxOutputTokens: 1024}})`.
- **Rate limit in-memory**: `Map<userId, timestamps[]>` con ventana de 60 s — MVP, no escala multi-proceso (ver backlog en 07-gap-analysis).

---

## Frontend — `TutorIA.jsx`

- Historial **local en estado** (no persiste); se resetea al cambiar de video.
- Envía la cola más reciente del historial (≤20 mensajes, empezando en un mensaje `user`) vía `ai.chat(video.id, historial)`.
- Indicador "El tutor está escribiendo…" mientras espera; errores del API se muestran como burbuja de chat roja (no rompen el flujo).
- Montado en `Reproductor.jsx` bajo la pestaña `Tutor IA` (estado `pestanaPanel`).
