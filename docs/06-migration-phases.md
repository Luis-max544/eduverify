# Migration Phases — EduVerify

Ordered by dependency. Each phase is independently deployable.

---

## Phase 0 — Backend Foundation

**Goal:** Backend running, DB connected, health check responds.

**Backend tasks:**
1. Create `backend/` directory with `package.json` (ESM, pnpm)
2. Write `docker-compose.yml` (MySQL 8 + Adminer on :8080)
3. Write `.env.example` and `.env`
4. Write `src/db/schema.js` with all Drizzle tables
5. Write `drizzle.config.js`
6. Run: `docker compose up -d` then `pnpm db:generate` then `pnpm db:migrate`
7. Write `src/config/db.js`, `src/config/env.js`
8. Write `src/index.js` with healthcheck route
9. Write `src/middleware/errorHandler.js`
10. Run `pnpm dev`

**Frontend tasks:** None.

**Verify:** `curl http://localhost:3001/api/health` → `{ "status": "ok" }`

---

## Phase 1 — Auth (unblocks all protected routes)

**Goal:** Register, login, Google OAuth, password reset all work end-to-end.

**Backend tasks:**
1. `src/middleware/auth.js` — verifyToken + requireRol
2. `src/services/email.js` — Nodemailer
3. `src/services/google.js` — tokeninfo fetch
4. `src/routes/auth.js` — all 5 auth endpoints
5. Mount auth router in `index.js`

**Frontend tasks (`Login.jsx` only):**
- Swap `./api/login.php` → `/api/auth/login`
- Swap `./api/registro.php` → `/api/auth/registro`
- Swap `./api/cambiar_password.php` → `/api/auth/cambiar-password`
- Swap `./api/actualizar_password.php` → `/api/auth/actualizar-password`
- On successful auth: store `{ token, user }` in `localStorage('eduverify_session')`
- Google `handleCredentialResponse`: POST credential to `/api/auth/google` instead of client-decode
- Create `src/lib/api.js` with `apiFetch` utility

**Also update `App.jsx`:**
- Change session key read from `usuario_eduverify` → `eduverify_session`
- On mount: call `GET /api/users/me` if token exists to refresh user data

**Add to `vite.config.js`:**
```js
server: { proxy: { '/api': 'http://localhost:3001' } }
```

**Verify:** Register → login → get JWT → `GET /api/users/me` returns user.

---

## Phase 2 — Videos CRUD

**Goal:** Videos come from MySQL. Catalog and PanelProfesor CRUD work.

**Backend tasks:**
1. `src/routes/videos.js` — GET list, GET by id, POST, PATCH, DELETE, POST view, GET by user
2. Mount in `index.js`
3. Seed 3–5 demo videos via a seed script or manual SQL insert

**Frontend tasks:**
- `App.jsx`: remove `videosDemo` localStorage init; fetch from `GET /api/videos` on mount; remove `useEffect` that wrote `videosDemo` to localStorage
- `PanelProfesor.jsx`: replace `./api/videos.php` GET → `GET /api/users/me/videos`; POST → `POST /api/videos`; DELETE → `DELETE /api/videos/:id`
- `Catalogo.jsx`: categoria filter now uses `?categoria=` query param (or keep client-side filter on the returned page — simpler MVP)

**Verify:** Catalog shows videos from DB. Professor uploads → appears in catalog.

---

## Phase 3 — User Profile, Avatar, Banner

**Goal:** Profile photo and banner stored as files, not base64 in localStorage.

**Backend tasks:**
1. `src/middleware/upload.js` — Multer diskStorage for avatar + banner
2. `src/routes/users.js` — GET /me, PATCH /me, POST avatar, POST banner, GET /:id/profile, GET /:id/videos
3. `app.use('/uploads', express.static('uploads'))` in `index.js`
4. Mount users router

**Frontend tasks:**
- `Configuracion.jsx`: name update → `PATCH /api/users/me`; avatar → `POST /api/users/me/avatar` FormData (remove base64 reader)
- `PanelProfesor.jsx`: banner upload → `POST /api/users/me/banner` FormData; avatar upload → `POST /api/users/me/avatar`; remove `handleGuardarPersonalizacion` localStorage write; read banner/avatar from `usuario` prop
- `Navbar.jsx`: replace `localStorage.getItem('eduverify_foto_${email}')` with `usuario.avatar_url`
- `Reproductor.jsx`: replace `localStorage.getItem('eduverify_foto_${email_autor}')` with `video.author_avatar_url` from API response

**Verify:** Upload avatar → refresh in different browser → avatar persists.

---

## Phase 4 — Comments

**Goal:** Comments, replies, and likes persisted in DB.

**Backend tasks:**
1. `src/routes/comments.js` — GET nested, POST, POST like, DELETE
2. Mount in `index.js`

**Frontend tasks (`Reproductor.jsx`):**
- Load comments: `GET /api/videos/:videoId/comments` on video change (replace localStorage read)
- Submit comment: `POST /api/videos/:videoId/comments` `{ texto }`
- Submit reply: `POST /api/videos/:videoId/comments` `{ texto, parent_id }`
- Like: `POST /api/comments/:id/like` → update local state with returned `{ likes, liked }`
- Remove `useEffect` that wrote comments to localStorage

**Verify:** Post comment → refresh → still there. Like → refresh → persists.

---

## Phase 5 — Favorites & History

**Goal:** Both survive page reload, user-specific in DB.

**Backend tasks:**
1. `src/routes/favorites.js`
2. `src/routes/history.js`
3. Mount both in `index.js`

**Frontend tasks:**
- `App.jsx`: init `favoritos` from `GET /api/favorites` on mount; `seleccionarYRegistrarVideo` fires `POST /api/history/:videoId` (no await, fire-and-forget)
- `Reproductor.jsx`: `manejarCorazon` calls `POST /api/favorites/:videoId` (add) or `DELETE /api/favorites/:videoId` (remove)
- `Historial.jsx`: fetch `GET /api/history` directly in component or receive from App
- `Favoritos.jsx`: receives `favoritos` from App prop (already fetched)

**Verify:** Heart video → refresh → still hearted. Watch video → history shows it in new tab.

---

## Phase 6 — Student Playlists

**Goal:** Watch-later folders from DB.

**Backend tasks:**
1. `src/routes/playlists.js`
2. Mount in `index.js`

**Frontend tasks:**
- `Reproductor.jsx`: fetch `GET /api/playlists` when playlist modal opens; `crearNuevaCarpeta` → `POST /api/playlists`; `toggleVideoEnCarpeta` → `POST/DELETE /api/playlists/:id/videos/:videoId`
- `Playlists.jsx`: fetch `GET /api/playlists` in component or receive from App; remove localStorage read
- `App.jsx`: remove `eduverify_listas_${email}` references

**Verify:** Create folder → add video → refresh → folder and video present.

---

## Phase 7 — Profesor Playlists

**Goal:** Course module playlists from DB. Canal view uses real data.

**Backend tasks:**
1. `src/routes/profesorPlaylists.js`
2. Mount in `index.js`

**Frontend tasks:**
- `PanelProfesor.jsx`: replace `eduverify_playlists_creadas_${email}` reads/writes with API calls
- `Canal.jsx`: fetch `GET /api/users/:userId/profesor/playlists` and `GET /api/users/:userId/videos`
- `App.jsx` `abrirCanalProfesor`: must pass `userId` (numeric) — find user id from video object or profile lookup

**Verify:** Professor creates module → visible on their public Canal page.

---

## Phase 8 — Subscriptions, Notifications, Dark Mode

**Goal:** All remaining social features in DB.

**Backend tasks:**
1. `src/routes/subscriptions.js`
2. `src/routes/notifications.js`
3. `PATCH /api/users/me/dark-mode` (already in users router from Phase 3)
4. Subscription POST creates notification row server-side

**Frontend tasks:**
- `App.jsx` `toggleSuscripcion`: call `POST/DELETE /api/subscriptions/:professorId`; refetch notifications after
- `App.jsx`: init subscriptions from `GET /api/subscriptions`; init notifications from `GET /api/notifications`; remove `useEffect` hooks writing to localStorage
- `Sidebar.jsx` dark mode toggle: call `PATCH /api/users/me/dark-mode` after state update
- `App.jsx` on mount: read `user.dark_mode` from `/api/users/me` to set `darkMode` state
- `Navbar.jsx`: notification count from API notifications array

**Verify:** Subscribe → notification appears. Toggle dark mode → refresh → preference remembered.

---

## Phase 9 — Premium

**Goal:** Premium status in DB.

**Backend tasks:**
1. `src/routes/premium.js`
2. Mount in `index.js`

**Frontend tasks:**
- `PasarelaPrueba.jsx`: `POST /api/premium/activate` → update `usuario` from response; remove localStorage write

**Verify:** Activate premium → logout → login → premium badge persists.

---

## Phase 10 — Cleanup

**Goal:** Zero localStorage references to old keys.

**Tasks:**
```bash
# Run to find remaining old localStorage keys:
grep -r "usuario_eduverify\|eduverify_videos_globales\|eduverify_foros\|eduverify_listas\|eduverify_playlists_creadas\|eduverify_foto_\|eduverify_banner_\|eduverify_suscripciones\|eduverify_notificaciones" eduverify/src/
```

- Remove any remaining localStorage reads/writes to old keys
- Update `CLAUDE.md` with new architecture
- Remove `base: './'` from `vite.config.js` for local dev (document separately for Hostinger builds)
- Verify `eduverify_session` is the only localStorage key used by the app

---

## Dependency graph

```
Phase 0 (backend up)
  └── Phase 1 (auth) ─── all other phases require JWT
        ├── Phase 2 (videos)
        │     ├── Phase 3 (uploads)
        │     ├── Phase 4 (comments)
        │     ├── Phase 5 (favorites/history)
        │     ├── Phase 6 (student playlists)
        │     └── Phase 7 (profesor playlists) ─── requires Phase 2
        ├── Phase 8 (subscriptions/notifications)
        └── Phase 9 (premium)
              └── Phase 10 (cleanup)
```
