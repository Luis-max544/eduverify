# API Specification — EduVerify

Base URL: `http://localhost:3001/api`

## Conventions

### Auth header
Protected routes require: `Authorization: Bearer <jwt_token>`

### Response envelope
```json
{ "status": "success" | "error", "data": {}, "message": "string" }
```
- On success: `status: "success"`, `data` contains result
- On error: `status: "error"`, `message` describes the error

### Pagination
GET list endpoints accept `?page=1&limit=20`. Response `data` includes `{ items[], total, page, limit }`.

---

## Auth — `/api/auth`

### `POST /api/auth/login`
No auth required.
```json
// body
{ "correo": "user@email.com", "password": "secret123" }

// response data
{
  "token": "eyJ...",
  "user": { "id": 1, "nombre": "Luis", "email": "...", "rol": "profesor", "premium": false, "avatar_url": "/uploads/avatars/1.jpg", "dark_mode": false }
}
```

### `POST /api/auth/registro`
No auth required.
```json
// body
{ "nombre": "Luis García", "correo": "luis@utn.edu", "password": "secret123", "rol": "estudiante" }

// response data
{ "message": "Usuario creado exitosamente" }
```

### `POST /api/auth/google`
No auth required. Receives Google credential JWT, verifies server-side via tokeninfo.
```json
// body
{ "credential": "eyJ..." }

// response data — same shape as /login
{ "token": "eyJ...", "user": { ... } }
```
Rol assigned: `estudiante` by default for Google signups.

### `POST /api/auth/cambiar-password`
No auth required. Sends reset email.
```json
// body
{ "email": "user@email.com" }

// response
{ "status": "success", "message": "Email de recuperación enviado" }
```

### `POST /api/auth/actualizar-password`
No auth required. Consumes reset token from URL params.
```json
// body
{ "id": 1, "token": "abc123...", "password": "newSecret456" }

// response
{ "status": "success", "message": "Contraseña actualizada" }
```
Token expires after 1 hour. Single-use (marks `used: true` after consumption).

---

## Users — `/api/users`

### `GET /api/users/me`
Auth required.
```json
// response data
{ "id": 1, "nombre": "Luis", "email": "...", "rol": "profesor", "premium": false, "avatar_url": "/uploads/avatars/1.jpg", "banner_url": "/uploads/banners/1.jpg", "dark_mode": false }
```

### `PATCH /api/users/me`
Auth required.
```json
// body (all optional)
{ "nombre": "Luis García" }

// response data — updated user object
```

### `PATCH /api/users/me/dark-mode`
Auth required.
```json
// body
{ "dark_mode": true }

// response
{ "status": "success" }
```

### `POST /api/users/me/avatar`
Auth required. `multipart/form-data`.
- Field name: `avatar`
- Max size: 2MB
- Allowed: `image/jpeg`, `image/png`, `image/webp`
- Stored at: `backend/uploads/avatars/{userId}.{ext}`
```json
// response data
{ "avatar_url": "/uploads/avatars/1.jpg" }
```

### `POST /api/users/me/banner`
Auth required. `multipart/form-data`.
- Field name: `banner`
- Max size: 5MB
- Same allowed types
- Stored at: `backend/uploads/banners/{userId}.{ext}`
```json
// response data
{ "banner_url": "/uploads/banners/1.jpg" }
```

### `GET /api/users/:id/profile`
No auth required. Public channel profile.
```json
// response data
{
  "id": 2,
  "nombre": "Prof. María López",
  "avatar_url": "/uploads/avatars/2.jpg",
  "banner_url": "/uploads/banners/2.jpg",
  "rol": "profesor",
  "video_count": 12,
  "subscriber_count": 340
}
```

### `GET /api/users/:id/videos`
No auth required. Videos by a specific user (for Canal view).
Accepts `?page=1&limit=20`.
```json
// response data
{ "items": [ ...videos ], "total": 12, "page": 1, "limit": 20 }
```

---

## Videos — `/api/videos`

### `GET /api/videos`
No auth required.
Query params: `?categoria=Programación&page=1&limit=20`
```json
// response data
{
  "items": [
    {
      "id": 1,
      "titulo": "Intro a React",
      "descripcion": "...",
      "url_video": "https://youtube.com/...",
      "categoria": "Programación",
      "tipo": "grabado",
      "es_premium": false,
      "vistas": 142,
      "duracion": "15:40",
      "autor": "Prof. María López",
      "autor_id": 2,
      "author_avatar_url": "/uploads/avatars/2.jpg",
      "created_at": "2026-01-15T..."
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20
}
```

### `GET /api/videos/:id`
No auth required. Single video.

### `POST /api/videos`
Auth required. Rol must be `profesor` or `creador`.
```json
// body
{
  "titulo": "Clase de SQL Avanzado",
  "descripcion": "...",
  "url_video": "https://youtube.com/...",
  "categoria": "Programación",
  "tipo": "grabado",
  "es_premium": false,
  "duracion": "45:20"
}

// response data — created video object
```

### `PATCH /api/videos/:id`
Auth required. Must be owner.
```json
// body (all optional)
{ "titulo": "...", "descripcion": "...", "categoria": "Matemáticas", "es_premium": true }
```

### `DELETE /api/videos/:id`
Auth required. Must be owner.
```json
// response
{ "status": "success" }
```

### `POST /api/videos/:id/view`
Auth required. Increments `vistas` counter.
```json
// response data
{ "vistas": 143 }
```

---

## Comments — `/api/comments`

### `GET /api/videos/:videoId/comments`
No auth required. Returns nested structure (replies inside root comments).
```json
// response data
[
  {
    "id": 10,
    "user_id": 3,
    "autor": "Luis García",
    "autor_avatar_url": "/uploads/avatars/3.jpg",
    "rol": "estudiante",
    "texto": "Excelente clase!",
    "likes": 5,
    "liked": false,
    "created_at": "2026-01-20T...",
    "respuestas": [
      {
        "id": 11,
        "user_id": 2,
        "autor": "Prof. María López",
        "autor_avatar_url": "/uploads/avatars/2.jpg",
        "rol": "profesor",
        "texto": "Gracias!",
        "likes": 2,
        "liked": false,
        "created_at": "2026-01-20T..."
      }
    ]
  }
]
```
`liked` field requires auth token to determine — if no token, always `false`.

### `POST /api/videos/:videoId/comments`
Auth required.
```json
// body
{ "texto": "Gran explicación", "parent_id": null }
// parent_id: null for root comment, comment id for reply

// response data — created comment object (flat, without respuestas)
```

### `POST /api/comments/:id/like`
Auth required. Toggles like for authenticated user.
```json
// response data
{ "likes": 6, "liked": true }
```

### `DELETE /api/comments/:id`
Auth required. Must be owner.

---

## Favorites — `/api/favorites`

### `GET /api/favorites`
Auth required. Returns full video objects.

### `POST /api/favorites/:videoId`
Auth required. Adds video to favorites. Idempotent.

### `DELETE /api/favorites/:videoId`
Auth required. Removes from favorites.

---

## History — `/api/history`

### `GET /api/history`
Auth required. Accepts `?limit=50`.
Returns videos ordered by `watched_at DESC`.

### `POST /api/history/:videoId`
Auth required. Upserts: inserts new row or updates `watched_at` if exists.

### `DELETE /api/history`
Auth required. Clears entire history for user.

### `DELETE /api/history/:videoId`
Auth required. Removes single entry.

---

## Student Playlists — `/api/playlists`

### `GET /api/playlists`
Auth required. Returns playlists with videos nested.
```json
// response data
[
  { "id": 1, "nombre": "Clases Guardadas", "videos": [ ...video objects ] },
  { "id": 2, "nombre": "Para repasar", "videos": [] }
]
```

### `POST /api/playlists`
Auth required.
```json
// body
{ "nombre": "Nueva carpeta" }
// response data — created playlist { id, nombre, videos: [] }
```

### `DELETE /api/playlists/:id`
Auth required. Must be owner. Cascades to `playlist_videos`.

### `POST /api/playlists/:id/videos/:videoId`
Auth required. Adds video to playlist. Idempotent.

### `DELETE /api/playlists/:id/videos/:videoId`
Auth required. Removes video from playlist.

---

## Profesor Playlists — `/api/profesor/playlists`

### `GET /api/profesor/playlists`
Auth required (profesor/creador). Own playlists with videos.

### `POST /api/profesor/playlists`
Auth required.
```json
{ "nombre": "Módulo 1: Fundamentos" }
```

### `PATCH /api/profesor/playlists/:id`
Auth required. Must be owner.
```json
{ "nombre": "Módulo 1: Fundamentos Actualizados" }
```

### `DELETE /api/profesor/playlists/:id`
Auth required. Must be owner.

### `POST /api/profesor/playlists/:id/videos/:videoId`
Auth required. Must be owner.
```json
// body optional
{ "orden": 2 }
```

### `DELETE /api/profesor/playlists/:id/videos/:videoId`
Auth required. Must be owner.

### `GET /api/users/:userId/profesor/playlists`
No auth required. Public — used by Canal view.

---

## Subscriptions — `/api/subscriptions`

### `GET /api/subscriptions`
Auth required. Returns professors the user is subscribed to.
```json
// response data
[
  { "professor_id": 2, "nombre": "Prof. María López", "avatar_url": "...", "notificaciones": true }
]
```

### `POST /api/subscriptions/:professorId`
Auth required. Subscribe. Creates notification row for subscriber.
```json
// body optional
{ "notificaciones": true }
```

### `DELETE /api/subscriptions/:professorId`
Auth required. Unsubscribe.

---

## Notifications — `/api/notifications`

### `GET /api/notifications`
Auth required. Accepts `?limit=20`. Ordered by `created_at DESC`.

### `PATCH /api/notifications/:id/read`
Auth required. Marks single notification as read.

### `PATCH /api/notifications/read-all`
Auth required. Marks all user's notifications as read.

---

## Premium — `/api/premium`

### `POST /api/premium/activate`
Auth required. Simulated — sets `premium: true`, `fecha_pago: NOW()` in DB.
```json
// body
{ "plan": "monthly" }

// response data
{ "premium": true, "fecha_pago": "2026-07-06T..." }
```

### `GET /api/premium/status`
Auth required.
```json
// response data
{ "premium": true, "fecha_pago": "2026-07-06T..." }
```

---

## Health

### `GET /api/health`
No auth. Returns `{ "status": "ok" }`. Used for Phase 0 verification.
