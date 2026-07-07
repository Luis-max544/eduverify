# Graph Report - eduverify  (2026-07-06)

## Corpus Check
- 65 files · ~42,031 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 513 nodes · 676 edges · 53 communities (46 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f7bcc63`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_DB Schema & Backend Tables|DB Schema & Backend Tables]]
- [[_COMMUNITY_Frontend Views (vista state)|Frontend Views (vista state)]]
- [[_COMMUNITY_Frontend View Components|Frontend View Components]]
- [[_COMMUNITY_Graphify Skill Docs|Graphify Skill Docs]]
- [[_COMMUNITY_Frontend Package Config|Frontend Package Config]]
- [[_COMMUNITY_Backend Package Config|Backend Package Config]]
- [[_COMMUNITY_Drizzle ORM Schema Relations|Drizzle ORM Schema Relations]]
- [[_COMMUNITY_Video History DB Module|Video History DB Module]]
- [[_COMMUNITY_Auth & Env Config|Auth & Env Config]]
- [[_COMMUNITY_Comments Backend Module|Comments Backend Module]]
- [[_COMMUNITY_File Upload Backend Module|File Upload Backend Module]]
- [[_COMMUNITY_Notifications & Subscriptions|Notifications & Subscriptions]]
- [[_COMMUNITY_Teacher Playlists Backend|Teacher Playlists Backend]]
- [[_COMMUNITY_UI Icon Sprite Set|UI Icon Sprite Set]]
- [[_COMMUNITY_Favorites Backend Module|Favorites Backend Module]]
- [[_COMMUNITY_Videos Backend Module|Videos Backend Module]]
- [[_COMMUNITY_App Stack & Entry Point|App Stack & Entry Point]]
- [[_COMMUNITY_Registro Component|Registro Component]]
- [[_COMMUNITY_VerMasTarde Component|VerMasTarde Component]]
- [[_COMMUNITY_Health Check Endpoint|Health Check Endpoint]]
- [[_COMMUNITY_Sidebar Quirk|Sidebar Quirk]]
- [[_COMMUNITY_App Favicon Icon|App Favicon Icon]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]

## God Nodes (most connected - your core abstractions)
1. `/graphify` - 29 edges
2. `users table` - 17 edges
3. `env` - 15 edges
4. `Tables` - 14 edges
5. `API Specification — EduVerify` - 14 edges
6. `Migration Phases — EduVerify` - 13 edges
7. `db` - 12 edges
8. `What You Must Do When Invoked` - 12 edges
9. `Views and their data contracts` - 12 edges
10. `users` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Simulated client-side auth` --semantically_similar_to--> `Traditional Auth Flow`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/04-auth-spec.md
- `Video creation/selection flow` --semantically_similar_to--> `profesor view (PanelProfesor.jsx)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/01-feature-spec.md
- `localStorage persistence keys` --semantically_similar_to--> `Session storage change`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/01-feature-spec.md
- `Dark mode toggle (Tailwind class)` --semantically_similar_to--> `Phase 8 - Subscriptions, Notifications, Dark Mode`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/06-migration-phases.md
- `User roles (profesor/estudiante/premium)` --shares_data_with--> `users table`  [INFERRED]
  CLAUDE.md → docs/02-db-schema.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **graphify build/query pipeline** — graphify_skill_graphify, references_query_traversal, references_extraction_spec_subagent_prompt, references_update_incremental_update [EXTRACTED 1.00]
- **Auth migration (Phase 1) flow** — docs_06_migration_phases_phase1_auth, docs_04_auth_spec_traditional_auth_flow, docs_04_auth_spec_google_oauth_flow, docs_04_auth_spec_password_reset_flow, docs_04_auth_spec_auth_middleware [INFERRED 0.85]
- **Avatar/banner upload flow** — docs_05_file_uploads_spec_multer_config, docs_05_file_uploads_spec_avatar_endpoint, docs_05_file_uploads_spec_banner_endpoint, docs_02_db_schema_users_table [INFERRED 0.85]

## Communities (53 total, 7 thin omitted)

### Community 0 - "DB Schema & Backend Tables"
Cohesion: 0.26
Nodes (12): comment_likes table, comments table, favorites table, history table, notifications table, playlist_videos table, playlists table (student folders), profesor_playlist_videos table (+4 more)

### Community 1 - "Frontend Views (vista state)"
Cohesion: 0.08
Nodes (29): canal view (Canal.jsx), catalogo view (Catalogo.jsx), configuracion view (Configuracion.jsx), favoritos view (Favoritos.jsx), historial view (Historial.jsx), login view (Login.jsx), profesor view (PanelProfesor.jsx), reproductor view (Reproductor.jsx) (+21 more)

### Community 2 - "Frontend View Components"
Cohesion: 0.08
Nodes (29): Canal(), Catalogo(), Configuracion(), Favoritos(), Historial(), Login(), Navbar(), CATEGORIAS (+21 more)

### Community 3 - "Graphify Skill Docs"
Cohesion: 0.06
Nodes (34): graphify trigger note (.claude/CLAUDE.md), graphify project integration rules, For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules (+26 more)

### Community 4 - "Frontend Package Config"
Cohesion: 0.08
Nodes (25): dependencies, react, react-dom, devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks (+17 more)

### Community 5 - "Backend Package Config"
Cohesion: 0.08
Nodes (24): dependencies, bcrypt, cors, dotenv, drizzle-orm, express, jsonwebtoken, multer (+16 more)

### Community 6 - "Drizzle ORM Schema Relations"
Cohesion: 0.07
Nodes (51): db, pool, env, required, commentLikes, comments, commentsRelations, favorites (+43 more)

### Community 7 - "Video History DB Module"
Cohesion: 0.12
Nodes (16): `comment_likes`, `comments`, Database Schema — EduVerify, ERD (text), `favorites`, `history`, `notifications`, `playlist_videos` (+8 more)

### Community 8 - "Auth & Env Config"
Cohesion: 0.13
Nodes (15): Part A - Structural extraction for code files, Part B - Semantic extraction (parallel subagents), Part C - Merge AST + semantic into final extraction, Step 0 - GitHub repos and multi-path merge (only if a URL or several paths), Step 1 - Ensure graphify is installed, Step 2.5 - Video and audio (only if video files detected), Step 2 - Detect files, Step 3 - Extract entities and relationships (+7 more)

### Community 9 - "Comments Backend Module"
Cohesion: 0.14
Nodes (13): canal, catalogo, configuracion, configuracion — dark mode, favoritos, Feature Specification — EduVerify, historial, login (+5 more)

### Community 10 - "File Upload Backend Module"
Cohesion: 0.33
Nodes (3): ALLOWED_TYPES, uploadAvatar, uploadBanner

### Community 11 - "Notifications & Subscriptions"
Cohesion: 0.14
Nodes (13): Dependency graph, Migration Phases — EduVerify, Phase 0 — Backend Foundation, Phase 10 — Cleanup, Phase 1 — Auth (unblocks all protected routes), Phase 2 — Videos CRUD, Phase 3 — User Profile, Avatar, Banner, Phase 4 — Comments (+5 more)

### Community 12 - "Teacher Playlists Backend"
Cohesion: 0.17
Nodes (11): API reference, Arquitectura, Autenticación, Convención de respuesta, EduVerify Backend, Modelo de datos, Scripts, Setup (+3 more)

### Community 13 - "UI Icon Sprite Set"
Cohesion: 0.29
Nodes (7): Bluesky butterfly logo icon, Discord game-controller-face logo icon, Documentation/book-with-bookmark outline icon (purple stroke), GitHub octocat/mark logo icon, Social/Documentation Icon Sprite Sheet (icons.svg), Social/community outline icon (person silhouette with star badge, purple stroke), X (formerly Twitter) logo icon

### Community 14 - "Favorites Backend Module"
Cohesion: 0.18
Nodes (10): After, Before (Configuracion.jsx, PanelProfesor.jsx), Endpoints, File Uploads Specification — EduVerify, Frontend changes (replacing base64), Multer Configuration (`middleware/upload.js`), `POST /api/users/me/avatar`, `POST /api/users/me/banner` (+2 more)

### Community 15 - "Videos Backend Module"
Cohesion: 0.20
Nodes (10): Adminer service (docker-compose), MySQL 8 service (docker-compose), premium view (PasarelaPrueba.jsx), /api/premium endpoints, verifyToken auth middleware, requireRol role guard helper, Phase 0 - Backend Foundation, Phase 10 - Cleanup (+2 more)

### Community 16 - "App Stack & Entry Point"
Cohesion: 0.67
Nodes (3): EduVerify stack (React 19 + Vite 8 + Tailwind 3), index.html app entry (#root, main.jsx), React + Vite starter template

### Community 17 - "Registro Component"
Cohesion: 0.20
Nodes (9): Auth Middleware (`middleware/auth.js`), Auth Specification — EduVerify, Client storage, Error codes, JWT, Lifetime, Payload shape, Role guard helper (+1 more)

### Community 18 - "VerMasTarde Component"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): API Specification — EduVerify, `DELETE /api/subscriptions/:professorId`, `GET /api/health`, `GET /api/subscriptions`, Health, `POST /api/subscriptions/:professorId`, Subscriptions — `/api/subscriptions`

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (8): `DELETE /api/profesor/playlists/:id`, `DELETE /api/profesor/playlists/:id/videos/:videoId`, `GET /api/profesor/playlists`, `GET /api/users/:userId/profesor/playlists`, `PATCH /api/profesor/playlists/:id`, `POST /api/profesor/playlists`, `POST /api/profesor/playlists/:id/videos/:videoId`, Profesor Playlists — `/api/profesor/playlists`

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (8): `GET /api/users/:id/profile`, `GET /api/users/:id/videos`, `GET /api/users/me`, `PATCH /api/users/me`, `PATCH /api/users/me/dark-mode`, `POST /api/users/me/avatar`, `POST /api/users/me/banner`, Users — `/api/users`

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): Session storage change, JWT payload shape, Login, Register, Traditional Auth Flow, localStorage persistence keys, Simulated client-side auth

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (7): `DELETE /api/videos/:id`, `GET /api/videos`, `GET /api/videos/:id`, `PATCH /api/videos/:id`, `POST /api/videos`, `POST /api/videos/:id/view`, Videos — `/api/videos`

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): /api/notifications endpoints, Phase 8 - Subscriptions, Notifications, Dark Mode, App.jsx global state management, Dark mode toggle (Tailwind class), User roles (profesor/estudiante/premium), Video creation/selection flow, vista navigation state (App.jsx)

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (6): Auth — `/api/auth`, `POST /api/auth/actualizar-password`, `POST /api/auth/cambiar-password`, `POST /api/auth/google`, `POST /api/auth/login`, `POST /api/auth/registro`

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (6): `DELETE /api/playlists/:id`, `DELETE /api/playlists/:id/videos/:videoId`, `GET /api/playlists`, `POST /api/playlists`, `POST /api/playlists/:id/videos/:videoId`, Student Playlists — `/api/playlists`

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (3): Architecture, Commands, graphify

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (5): Comments — `/api/comments`, `DELETE /api/comments/:id`, `GET /api/videos/:videoId/comments`, `POST /api/comments/:id/like`, `POST /api/videos/:videoId/comments`

### Community 38 - "Community 38"
Cohesion: 0.40
Nodes (5): `DELETE /api/history`, `DELETE /api/history/:videoId`, `GET /api/history`, History — `/api/history`, `POST /api/history/:videoId`

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (4): reset_tokens table, Password Reset Flow, Step 1 — Request reset, Step 2 — Update password

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (4): Auth header, Conventions, Pagination, Response envelope

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (4): `DELETE /api/favorites/:videoId`, Favorites — `/api/favorites`, `GET /api/favorites`, `POST /api/favorites/:videoId`

### Community 42 - "Community 42"
Cohesion: 0.50
Nodes (4): `GET /api/notifications`, Notifications — `/api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): Client side (Login.jsx — unchanged), Google OAuth Flow, Migration change, Server side (`routes/auth.js`)

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 45 - "Community 45"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 46 - "Community 46"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (3): `GET /api/premium/status`, `POST /api/premium/activate`, Premium — `/api/premium`

## Knowledge Gaps
- **263 isolated node(s):** `name`, `version`, `type`, `dev`, `start` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API Specification — EduVerify` connect `Community 27` to `Community 33`, `Community 34`, `Community 37`, `Community 38`, `Community 40`, `Community 41`, `Community 42`, `Community 48`, `Community 28`, `Community 29`, `Community 31`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `users table` connect `DB Schema & Backend Tables` to `Community 32`, `Frontend Views (vista state)`, `Community 39`, `Community 43`, `Videos Backend Module`, `Community 30`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Phase 1 - Auth` connect `Videos Backend Module` to `Community 32`, `Frontend Views (vista state)`, `Community 39`, `Community 43`, `Community 30`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `users table` (e.g. with `MySQL 8 service (docker-compose)` and `JWT payload shape`) actually correct?**
  _`users table` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _267 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Views (vista state)` be split into smaller, more focused modules?**
  _Cohesion score 0.07881773399014778 - nodes in this community are weakly interconnected._
- **Should `Frontend View Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08181818181818182 - nodes in this community are weakly interconnected._