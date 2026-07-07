# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend (from `eduverify/`):

```bash
cd eduverify
pnpm dev        # dev server (localhost:5173)
pnpm build      # production build
pnpm lint       # ESLint
pnpm preview    # preview production build
```

Backend (from `backend/`):

```bash
cd backend
docker compose up -d   # MySQL 8 (:3306) + Adminer (:8080)
pnpm db:migrate        # apply Drizzle migrations
pnpm dev               # API server (localhost:3001)
```

No test suite configured.

## Architecture

**Stack**: React 19 + Vite 8 + Tailwind CSS 3 frontend; Express + Drizzle ORM + MySQL 8 backend (`backend/`). Frontend talks to the REST API at `VITE_API_URL` (default `http://localhost:3001`), prefix `/api`, response envelope `{ status: 'success'|'error', data|message }`.

**API client**: `eduverify/src/api.js` is the single HTTP layer — JWT Bearer token in localStorage key `eduverify_token` (the only localStorage key), envelope unwrapping, and a `auth:logout` window event on 401. All components import route groups from it (`auth`, `users`, `videos`, `comments`, `favorites`, `history`, `playlists`, `profesorPlaylists`, `subscriptions`, `notifications`, `premium`).

**Navigation**: Custom `vista` string state in `App.jsx` replaces React Router. Views: `login`, `catalogo`, `reproductor`, `profesor`, `premium`, `configuracion`, `favoritos`, `historial`, `videos-guardados`, `canal`. To navigate, call `setVista('view-name')`.

**State management**: All global state lives in `App.jsx` and is passed as props. No Context, Redux, or Zustand. On login (or token rehydration via `GET /users/me`), App.jsx hydrates `videosDemo`, `favoritos`, `historial`, `suscripciones`, and `notificaciones` from the API. Mutations call the API then update local state (often optimistically).

**Auth**: JWT (7d) issued by `POST /api/auth/login` or `/api/auth/google` (server-validated Google credential; client id from `VITE_GOOGLE_CLIENT_ID`). `POST /api/auth/registro` returns no token — Login.jsx chains a login call after registering. Password reset uses URL params `?action=reset&id=...&token=...` → `POST /api/auth/actualizar-password`.

**User shape** (`formatUser`): `{ id, nombre, email, rol: 'estudiante'|'profesor'|'creador', premium, dark_mode, avatar_url, banner_url }`. Avatar/banner are absolute URLs served from backend `/uploads`; uploaded via multipart `POST /users/me/avatar|banner`.

**Video shape**: `{ id, titulo, descripcion, url_video, categoria, tipo, es_premium, vistas, duracion, created_at, autor, autor_id, author_avatar_url }`. `categoria` is a strict enum: `Programación|Ciberseguridad|Matemáticas|Electrónica|Arte`. `PATCH /videos/:id` returns a raw DB row — always refetch `GET /videos/:id` after editing.

**Dark mode**: Tailwind `darkMode: 'class'`. `darkMode` boolean state in App.jsx toggles the `dark` class on the root div; persisted server-side via `PATCH /users/me/dark-mode` and restored from `users.me()`.

**Roles**: `profesor`/`creador` unlock `PanelProfesor` and video/playlist creation (enforced server-side by JWT rol). `estudiante` is default. `premium` boolean gates `PasarelaPrueba`; activated via `POST /premium/activate`.

**Video flow**: Videos created in `PanelProfesor` via `POST /videos` (author derived from JWT) → App.jsx `recargarVideos()` refreshes the catalog. Selecting a video calls `seleccionarYRegistrarVideo` which sets `vista = 'reproductor'` and fires `POST /videos/:id/view` + `POST /history/:id`.

**Comments gotcha**: `GET /videos/:id/comments` is public and never sets `liked: true` (no optional-auth middleware) — Reproductor tracks like state optimistically from the `POST /comments/:id/like` toggle response.

**`Sidebar` quirk**: Internally maps `vista === 'videos-guardados'` ↔ `'playlists'` — the sidebar label says "Playlists" but the view key is `videos-guardados`. That view (`Playlists.jsx`) renders the student's save-folders from `/api/playlists`; teacher playlists are a separate resource (`/api/profesor/playlists`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
