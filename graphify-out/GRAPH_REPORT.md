# Graph Report - eduverify  (2026-07-12)

## Corpus Check
- 89 files · ~71,183 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 656 nodes · 992 edges · 68 communities (59 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47224fea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Database & Config Layer|Database & Config Layer]]
- [[_COMMUNITY_React UI Views|React UI Views]]
- [[_COMMUNITY_API & Backend Schema|API & Backend Schema]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Dev Tooling & Docs|Dev Tooling & Docs]]
- [[_COMMUNITY_Courses & Progress System|Courses & Progress System]]
- [[_COMMUNITY_File Upload Middleware|File Upload Middleware]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_Social Activity Tables|Social Activity Tables]]
- [[_COMMUNITY_Auth & User Profile|Auth & User Profile]]
- [[_COMMUNITY_Video Player & Social|Video Player & Social]]
- [[_COMMUNITY_Docker & Auth Flows|Docker & Auth Flows]]
- [[_COMMUNITY_Breadcrumb Navigation|Breadcrumb Navigation]]
- [[_COMMUNITY_Content & Creator Views|Content & Creator Views]]
- [[_COMMUNITY_Brand Icon Sprites|Brand Icon Sprites]]
- [[_COMMUNITY_Favorites & History|Favorites & History]]
- [[_COMMUNITY_Premium & Cleanup|Premium & Cleanup]]
- [[_COMMUNITY_JWT Auth Middleware|JWT Auth Middleware]]
- [[_COMMUNITY_GTA VI Avatar Assets|GTA VI Avatar Assets]]
- [[_COMMUNITY_GTA VI Banner Asset|GTA VI Banner Asset]]
- [[_COMMUNITY_Health Endpoint|Health Endpoint]]
- [[_COMMUNITY_React Vite Template|React Vite Template]]
- [[_COMMUNITY_EduVerify Favicon|EduVerify Favicon]]
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
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]

## God Nodes (most connected - your core abstractions)
1. `/graphify` - 28 edges
2. `env` - 17 edges
3. `users table` - 16 edges
4. `db` - 15 edges
5. `useToast()` - 15 edges
6. `users` - 14 edges
7. `Tables` - 14 edges
8. `API Specification — EduVerify` - 14 edges
9. `verifyToken()` - 13 edges
10. `Migration Phases — EduVerify` - 13 edges

## Surprising Connections (you probably didn't know these)
- `In-memory Rate Limit (10 req/min/user, Map-based, MVP non-distributed)` --semantically_similar_to--> `Premium Gating System (boolean flag, PasarelaPrueba, POST /premium/activate)`  [INFERRED] [semantically similar]
  docs/10-ai-chat-spec.md → CLAUDE.md
- `Vista String State Navigation Pattern (Custom Router in App.jsx)` --semantically_similar_to--> `Express Route Order Gotcha: /mis-cursos Before /:id`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/08-courses-spec.md
- `MySQL 8 service (docker-compose)` --shares_data_with--> `users table`  [INFERRED]
  backend/docker-compose.yml → docs/02-db-schema.md
- ``course_enrollments`` --shares_data_with--> `users DB Table (rol enum, premium boolean, reset_tokens related)`  [EXTRACTED]
  docs/08-courses-spec.md → backend/README.md
- ``lesson_progress`` --shares_data_with--> `videos DB Table (categoria enum, es_premium, vistas, usuario_id FK)`  [EXTRACTED]
  docs/08-courses-spec.md → backend/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **graphify build/query pipeline** — graphify_skill_graphify, references_query_traversal, references_extraction_spec_subagent_prompt, references_update_incremental_update [EXTRACTED 1.00]
- **Avatar/banner upload flow** — docs_05_file_uploads_spec_multer_config, docs_05_file_uploads_spec_avatar_endpoint, docs_05_file_uploads_spec_banner_endpoint, docs_02_db_schema_users_table [INFERRED 0.85]
- **Auth migration (Phase 1) flow** — docs_06_migration_phases_phase1_auth, docs_04_auth_spec_traditional_auth_flow, docs_04_auth_spec_google_oauth_flow, docs_04_auth_spec_password_reset_flow, docs_04_auth_spec_auth_middleware [INFERRED 0.85]
- **Course Learning Flow: Enrollment + Lesson Progress + Reviews** — docs_08_courses_spec_course_enrollments, docs_08_courses_spec_lesson_progress, docs_09_reviews_spec_course_reviews [INFERRED 0.95]
- **JWT Authentication System: Google OAuth + JWT Tokens + Role Enforcement** — eduverify_claude_google_oauth, eduverify_claude_jwt_auth, eduverify_claude_user_roles [INFERRED 0.95]
- **AI Tutor Pipeline: Gemini SDK + Rate Limit + System Prompt + /api/ai/chat Route** — docs_10_ai_chat_spec_gemini_integration, docs_10_ai_chat_spec_rate_limit, docs_10_ai_chat_spec_system_prompt, docs_10_ai_chat_spec_ai_route [EXTRACTED 1.00]

## Communities (68 total, 9 thin omitted)

### Community 0 - "Database & Config Layer"
Cohesion: 0.09
Nodes (22): commentsRelations, courseEnrollmentsRelations, courseReviews, courseReviewsRelations, lessonProgressRelations, pdfResources, playlistsRelations, profesorPlaylists (+14 more)

### Community 1 - "React UI Views"
Cohesion: 0.07
Nodes (44): Canal(), AVATAR_COLORS, Catalogo(), CATEGORIAS, Configuracion(), CursoDetalle(), Favoritos(), Historial() (+36 more)

### Community 2 - "API & Backend Schema"
Cohesion: 0.17
Nodes (17): OpenAPI Specification — EduVerify REST API (39 endpoints), Error Handler Middleware (ZodError/multer/generic → { status, message }), Multer Upload Middleware (avatar 2MB / banner 5MB, JPEG/PNG/WebP only), users DB Table (rol enum, premium boolean, reset_tokens related), videos DB Table (categoria enum, es_premium, vistas, usuario_id FK), Zod Validation — Request Body and Params Schema Validation, Express Route Order Gotcha: /mis-cursos Before /:id, CLAUDE.md — Project Architecture Guide (+9 more)

### Community 3 - "Backend Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, bcrypt, cors, dotenv, drizzle-orm, express, @google/genai, jsonwebtoken (+19 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, lucide-react, react, react-dom, devDependencies, autoprefixer, eslint, @eslint/js (+18 more)

### Community 5 - "Dev Tooling & Docs"
Cohesion: 0.06
Nodes (33): graphify trigger note (.claude/CLAUDE.md), For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands (+25 more)

### Community 6 - "Courses & Progress System"
Cohesion: 0.15
Nodes (13): courseEnrollments, lessonProgress, quizAttempts, avatarUrl(), base(), checkLeccion(), checkQuiz(), estaInscrito() (+5 more)

### Community 7 - "File Upload Middleware"
Cohesion: 0.17
Nodes (10): ALLOWED_PDF, ALLOWED_TYPES, uploadAvatar, uploadBanner, uploadPdf, avatarUrl(), bannerUrl(), formatUser() (+2 more)

### Community 8 - "Database Seeding"
Cohesion: 0.25
Nodes (13): bulkInsert(), CATEGORIAS, clean(), dedup(), dur(), genComment(), genUser(), genVideo() (+5 more)

### Community 9 - "Social Activity Tables"
Cohesion: 0.26
Nodes (12): comment_likes table, comments table, favorites table, history table, notifications table, playlist_videos table, playlists table (student folders), profesor_playlist_videos table (+4 more)

### Community 10 - "Auth & User Profile"
Cohesion: 0.07
Nodes (31): canal view (Canal.jsx), catalogo view (Catalogo.jsx), configuracion view (Configuracion.jsx), favoritos view (Favoritos.jsx), historial view (Historial.jsx), login view (Login.jsx), profesor view (PanelProfesor.jsx), reproductor view (Reproductor.jsx) (+23 more)

### Community 11 - "Video Player & Social"
Cohesion: 0.20
Nodes (13): db, pool, notifications, subscriptions, users, optionalAuth(), requireRol(), verifyToken() (+5 more)

### Community 12 - "Docker & Auth Flows"
Cohesion: 0.18
Nodes (11): Adminer service (docker-compose), MySQL 8 service (docker-compose), Session storage change, verifyToken auth middleware, JWT payload shape, Login, Register, requireRol role guard helper (+3 more)

### Community 13 - "Breadcrumb Navigation"
Cohesion: 0.29
Nodes (4): Breadcrumbs(), cache, getCached(), LABELS

### Community 14 - "Content & Creator Views"
Cohesion: 0.12
Nodes (16): `comment_likes`, `comments`, Database Schema — EduVerify, ERD (text), `favorites`, `history`, `notifications`, `playlist_videos` (+8 more)

### Community 15 - "Brand Icon Sprites"
Cohesion: 0.29
Nodes (7): Bluesky butterfly logo icon, Discord game-controller-face logo icon, Documentation/book-with-bookmark outline icon (purple stroke), GitHub octocat/mark logo icon, Social/Documentation Icon Sprite Sheet (icons.svg), Social/community outline icon (person silhouette with star badge, purple stroke), X (formerly Twitter) logo icon

### Community 16 - "Favorites & History"
Cohesion: 0.13
Nodes (15): Part A - Structural extraction for code files, Part B - Semantic extraction (parallel subagents), Part C - Merge AST + semantic into final extraction, Step 0 - GitHub repos and multi-path merge (only if a URL or several paths), Step 1 - Ensure graphify is installed, Step 2.5 - Video and audio (only if video files detected), Step 2 - Detect files, Step 3 - Extract entities and relationships (+7 more)

### Community 17 - "Premium & Cleanup"
Cohesion: 0.50
Nodes (4): premium view (PasarelaPrueba.jsx), /api/premium endpoints, Phase 10 - Cleanup, Phase 9 - Premium

### Community 18 - "JWT Auth Middleware"
Cohesion: 0.30
Nodes (10): profesor_playlists DB Table (curso backbone, with orden for lesson ordering), `course_enrollments`, CursoDetalle.jsx — Course Detail View (stars, progress bar, enroll, lesson list, reviews), /api/cursos/* Route Group (enrollment, progress, lesson completion endpoints), `lesson_progress`, MisCursos.jsx — My Enrolled Courses Grid View with Progress, Progress % Calculation via JOIN Against Current Playlist (orphaned lessons excluded), course_reviews DB Table (1–5 stars, unique per user/course, upsert via ON DUPLICATE KEY) (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (11): history, errorHandler(), router, router, base(), formatVideo(), router, router (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (13): canal, catalogo, configuracion, configuracion — dark mode, favoritos, Feature Specification — EduVerify, historial, login (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): Dependency graph, Migration Phases — EduVerify, Phase 0 — Backend Foundation, Phase 10 — Cleanup, Phase 1 — Auth (unblocks all protected routes), Phase 2 — Videos CRUD, Phase 3 — User Profile, Avatar, Banner, Phase 4 — Comments (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (11): API reference, Arquitectura, Autenticación, Convención de respuesta, EduVerify Backend, Modelo de datos, Scripts, Setup (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.31
Nodes (5): env, required, sendPasswordReset(), transporter, verifyGoogleCredential()

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (10): API Specification — EduVerify, Auth header, Conventions, `GET /api/health`, `GET /api/premium/status`, Health, Pagination, `POST /api/premium/activate` (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (10): After, Before (Configuracion.jsx, PanelProfesor.jsx), Endpoints, File Uploads Specification — EduVerify, Frontend changes (replacing base64), Multer Configuration (`middleware/upload.js`), `POST /api/users/me/avatar`, `POST /api/users/me/banner` (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (8): Auth Middleware (`middleware/auth.js`), Auth Specification — EduVerify, Client side (Login.jsx — unchanged), Error codes, Google OAuth Flow, Migration change, Role guard helper, Server side (`routes/auth.js`)

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (8): `DELETE /api/profesor/playlists/:id`, `DELETE /api/profesor/playlists/:id/videos/:videoId`, `GET /api/profesor/playlists`, `GET /api/users/:userId/profesor/playlists`, `PATCH /api/profesor/playlists/:id`, `POST /api/profesor/playlists`, `POST /api/profesor/playlists/:id/videos/:videoId`, Profesor Playlists — `/api/profesor/playlists`

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (8): `GET /api/users/:id/profile`, `GET /api/users/:id/videos`, `GET /api/users/me`, `PATCH /api/users/me`, `PATCH /api/users/me/dark-mode`, `POST /api/users/me/avatar`, `POST /api/users/me/banner`, Users — `/api/users`

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (7): `DELETE /api/videos/:id`, `GET /api/videos`, `GET /api/videos/:id`, `PATCH /api/videos/:id`, `POST /api/videos`, `POST /api/videos/:id/view`, Videos — `/api/videos`

### Community 41 - "Community 41"
Cohesion: 0.48
Nodes (6): Feature Backlog — 10 Prioritized Pending Items (search, premium gating, streaming AI, etc.), POST /api/ai/chat Endpoint (video_id + messages array, JWT auth, 10 req/min), Google Gemini Integration (@google/genai SDK, gemini-2.5-flash default model), In-memory Rate Limit (10 req/min/user, Map-based, MVP non-distributed), AI System Prompt Design with Video Context (titulo, categoria, autor, descripcion), TutorIA.jsx — Local Chat History, Tab Panel in Reproductor

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (5): favorites, videos, base(), formatVideo(), router

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (3): playlists, playlistVideos, router

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (6): Auth — `/api/auth`, `POST /api/auth/actualizar-password`, `POST /api/auth/cambiar-password`, `POST /api/auth/google`, `POST /api/auth/login`, `POST /api/auth/registro`

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (6): `DELETE /api/playlists/:id`, `DELETE /api/playlists/:id/videos/:videoId`, `GET /api/playlists`, `POST /api/playlists`, `POST /api/playlists/:id/videos/:videoId`, Student Playlists — `/api/playlists`

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (6): Courses Specification — EduVerify, Endpoints `/api/cursos` (`backend/src/routes/cursos.js`), Frontend, `profesor_playlists` (extendida), Rutas nuevas en `/api/profesor/playlists`, Schema

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (6): AI Tutor Chat Specification — EduVerify, Configuración, Endpoint — `POST /api/ai/chat` (`backend/src/routes/ai.js`), Errores, Frontend — `TutorIA.jsx`, Implementación

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (3): Architecture, Commands, graphify

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (3): commentLikes, comments, router

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (5): Comments — `/api/comments`, `DELETE /api/comments/:id`, `GET /api/videos/:videoId/comments`, `POST /api/comments/:id/like`, `POST /api/videos/:videoId/comments`

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (5): `DELETE /api/history`, `DELETE /api/history/:videoId`, `GET /api/history`, History — `/api/history`, `POST /api/history/:videoId`

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (5): Client storage, JWT, Lifetime, Payload shape, Signing

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (4): reset_tokens table, Password Reset Flow, Step 1 — Request reset, Step 2 — Update password

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (4): `DELETE /api/favorites/:videoId`, Favorites — `/api/favorites`, `GET /api/favorites`, `POST /api/favorites/:videoId`

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (4): `DELETE /api/subscriptions/:professorId`, `GET /api/subscriptions`, `POST /api/subscriptions/:professorId`, Subscriptions — `/api/subscriptions`

### Community 57 - "Community 57"
Cohesion: 0.50
Nodes (4): `GET /api/notifications`, Notifications — `/api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (4): Backlog priorizado, Comparativa, Gap Analysis — EduVerify vs Udemy/YouTube, Implementado en esta fase

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (4): Course Reviews Specification — EduVerify, Endpoints (en `backend/src/routes/cursos.js`), Frontend, Schema — `course_reviews`

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **302 isolated node(s):** `name`, `version`, `type`, `dev`, `start` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API Specification — EduVerify` connect `Community 34` to `Community 38`, `Community 39`, `Community 40`, `Community 44`, `Community 45`, `Community 51`, `Community 52`, `Community 55`, `Community 56`, `Community 57`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `users table` connect `Social Activity Tables` to `Auth & User Profile`, `Docker & Auth Flows`, `Community 54`, `Community 36`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Phase 1 - Auth` connect `Docker & Auth Flows` to `Premium & Cleanup`, `Auth & User Profile`, `Community 36`, `Community 54`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `users table` (e.g. with `MySQL 8 service (docker-compose)` and `JWT payload shape`) actually correct?**
  _`users table` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _306 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Database & Config Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08505747126436781 - nodes in this community are weakly interconnected._
- **Should `React UI Views` be split into smaller, more focused modules?**
  _Cohesion score 0.06905370843989769 - nodes in this community are weakly interconnected._