# Feature Specification — EduVerify

## Views and their data contracts

---

### login
**Component:** `Login.jsx`

| Action | localStorage (before) | API (after) |
|--------|----------------------|-------------|
| Login email/password | writes `usuario_eduverify` | `POST /api/auth/login` → stores `eduverify_session: { token, user }` |
| Registro | writes `usuario_eduverify` | `POST /api/auth/registro` |
| Google OAuth | decodes JWT client-side, writes `usuario_eduverify` | `POST /api/auth/google` → server verifies via tokeninfo |
| Recuperar contraseña | — | `POST /api/auth/cambiar-password` |
| Nuevo password (URL params) | — | `POST /api/auth/actualizar-password` |

URL params flow: `?action=reset&id=<userId>&token=<resetToken>` → `modoNuevoPassword` in component.

---

### catalogo
**Component:** `Catalogo.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Lista de videos | reads `eduverify_videos_globales` | `GET /api/videos?categoria=&page=&limit=` |
| Filtro por categoría | client-side filter | query param `?categoria=Programación` |
| Favoritos toggle | prop from App state | `POST/DELETE /api/favorites/:videoId` |

Categories: `Todos`, `Programación`, `Ciberseguridad`, `Matemáticas`, `Electrónica`, `Arte`

---

### reproductor
**Component:** `Reproductor.jsx` — most complex component

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Comentarios | `eduverify_foros_video_${video.id}` | `GET /api/videos/:id/comments` |
| Crear comentario | localStorage write | `POST /api/videos/:videoId/comments` `{ texto }` |
| Responder comentario | localStorage write | `POST /api/videos/:videoId/comments` `{ texto, parent_id }` |
| Like comentario | localStorage write | `POST /api/comments/:id/like` → `{ likes, liked }` |
| Mis playlists (guardar video) | `eduverify_listas_${email}` | `GET /api/playlists` |
| Crear carpeta | localStorage write | `POST /api/playlists` `{ nombre }` |
| Toggle video en carpeta | localStorage write | `POST/DELETE /api/playlists/:id/videos/:videoId` |
| Avatar del autor del video | `eduverify_foto_${email_autor}` | `video.author_avatar_url` (JOIN en API) |
| Avatar propio | `eduverify_foto_${email}` | `usuario.avatar_url` (desde App state) |
| Suscripción al profesor | via App `toggleSuscripcion` | `POST/DELETE /api/subscriptions/:professorId` |
| Registro en historial | via App `seleccionarYRegistrarVideo` | `POST /api/history/:videoId` (fire-and-forget) |
| Incrementar vistas | no implementado | `POST /api/videos/:id/view` |

---

### profesor (PanelProfesor)
**Component:** `PanelProfesor.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Videos del profesor | `GET ./api/videos.php` filtered by user | `GET /api/users/me/videos` |
| Subir video | `POST ./api/videos.php` | `POST /api/videos` |
| Eliminar video | `DELETE ./api/videos.php?id=` | `DELETE /api/videos/:id` |
| Editar video | sin persistencia real | `PATCH /api/videos/:id` |
| Banner del canal | `eduverify_banner_${email}` (base64) | `POST /api/users/me/banner` (FormData) |
| Avatar | `eduverify_foto_${email}` (base64) | `POST /api/users/me/avatar` (FormData) |
| Guardar personalización | localStorage write | `PATCH /api/users/me` + avatar/banner uploads |
| Playlists del profesor | `eduverify_playlists_creadas_${email}` | `GET /api/profesor/playlists` |
| Crear playlist | localStorage write | `POST /api/profesor/playlists` `{ nombre }` |
| Renombrar playlist | localStorage write | `PATCH /api/profesor/playlists/:id` `{ nombre }` |
| Eliminar playlist | localStorage write | `DELETE /api/profesor/playlists/:id` |

Video upload progress: simulado con timeouts (30% → 70% → 100%). Mantener UX, cambiar solo la llamada API.

---

### configuracion
**Component:** `Configuracion.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Actualizar nombre | escribía a `usuario_eduverify` | `PATCH /api/users/me` `{ nombre }` |
| Subir avatar | base64 a `eduverify_foto_${email}` | `POST /api/users/me/avatar` (FormData) |
| Cambiar contraseña | — | `POST /api/auth/cambiar-password` |

---

### favoritos
**Component:** `Favoritos.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Lista de favoritos | React state (perdido en refresh) | `GET /api/favorites` — inicializar en App al montar |

---

### historial
**Component:** `Historial.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Videos vistos | React state (perdido en refresh) | `GET /api/history?limit=50` |

---

### videos-guardados (Playlists)
**Component:** `Playlists.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Carpetas y videos | `eduverify_listas_${email}` | `GET /api/playlists` (con videos nested) |

---

### canal
**Component:** `Canal.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Info del canal | objeto construido en App hardcodeado | `GET /api/users/:id/profile` |
| Videos del canal | filtra `videosDemo` por `v.autor` | `GET /api/users/:id/videos` |
| Playlists del profesor | `eduverify_playlists_creadas_${prof.email}` | `GET /api/users/:userId/profesor/playlists` |

**Cambio necesario en App.jsx:** `abrirCanalProfesor` debe pasar `userId` numérico en el objeto `canal`, no solo `nombre`.

---

### premium (PasarelaPrueba)
**Component:** `PasarelaPrueba.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Activar premium | escribía `usuario.premium = true` a localStorage | `POST /api/premium/activate` → actualiza `usuario` state con response |
| Estado premium | lee `usuario.premium` | `GET /api/premium/status` |

---

### configuracion — dark mode
**Components:** `App.jsx`, `Sidebar.jsx`

| Data | localStorage (before) | API (after) |
|------|----------------------|-------------|
| Preferencia dark mode | React state (perdido en refresh) | `PATCH /api/users/me/dark-mode` + leer de `user.dark_mode` al inicializar |

---

## Session storage change

| Antes | Después |
|-------|---------|
| `localStorage('usuario_eduverify')` → objeto usuario crudo | `localStorage('eduverify_session')` → `{ token: string, user: object }` |

Token JWT: 7 días TTL. Al expirar, re-login (no refresh token en MVP).

Al iniciar App: leer `eduverify_session`, si token existe llamar `GET /api/users/me` para refrescar datos del usuario.
