# Graph Report - .  (2026-07-12)

## Corpus Check
- 96 files · ~70,698 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 408 nodes · 742 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `graphify skill` - 18 edges
2. `env` - 17 edges
3. `users table` - 16 edges
4. `db` - 15 edges
5. `useToast()` - 15 edges
6. `users` - 14 edges
7. `verifyToken()` - 13 edges
8. `Backend README — EduVerify API Documentation` - 11 edges
9. `Courses Specification — Udemy-style Structured Courses on EduVerify` - 11 edges
10. `videos` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Vista String State Navigation Pattern (Custom Router in App.jsx)` --semantically_similar_to--> `Express Route Order Gotcha: /mis-cursos Before /:id`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/08-courses-spec.md
- `In-memory Rate Limit (10 req/min/user, Map-based, MVP non-distributed)` --semantically_similar_to--> `Premium Gating System (boolean flag, PasarelaPrueba, POST /premium/activate)`  [INFERRED] [semantically similar]
  docs/10-ai-chat-spec.md → CLAUDE.md
- `MySQL 8 service (docker-compose)` --shares_data_with--> `users table`  [INFERRED]
  backend/docker-compose.yml → docs/02-db-schema.md
- `Phase 0 - Backend Foundation` --references--> `MySQL 8 service (docker-compose)`  [EXTRACTED]
  docs/06-migration-phases.md → backend/docker-compose.yml
- `Google OAuth server-side verification flow` --references--> `users table`  [EXTRACTED]
  docs/04-auth-spec.md → docs/02-db-schema.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **graphify build/query pipeline** — graphify_skill_graphify, references_query_traversal, references_extraction_spec_subagent_prompt, references_update_incremental_update [EXTRACTED 1.00]
- **Avatar/banner upload flow** — docs_05_file_uploads_spec_multer_config, docs_05_file_uploads_spec_avatar_endpoint, docs_05_file_uploads_spec_banner_endpoint, docs_02_db_schema_users_table [INFERRED 0.85]
- **Auth migration (Phase 1) flow** — docs_06_migration_phases_phase1_auth, docs_04_auth_spec_traditional_auth_flow, docs_04_auth_spec_google_oauth_flow, docs_04_auth_spec_password_reset_flow, docs_04_auth_spec_auth_middleware [INFERRED 0.85]
- **Course Learning Flow: Enrollment + Lesson Progress + Reviews** — docs_08_courses_spec_course_enrollments, docs_08_courses_spec_lesson_progress, docs_09_reviews_spec_course_reviews [INFERRED 0.95]
- **JWT Authentication System: Google OAuth + JWT Tokens + Role Enforcement** — eduverify_claude_google_oauth, eduverify_claude_jwt_auth, eduverify_claude_user_roles [INFERRED 0.95]
- **AI Tutor Pipeline: Gemini SDK + Rate Limit + System Prompt + /api/ai/chat Route** — docs_10_ai_chat_spec_gemini_integration, docs_10_ai_chat_spec_rate_limit, docs_10_ai_chat_spec_system_prompt, docs_10_ai_chat_spec_ai_route [EXTRACTED 1.00]

## Communities (29 total, 5 thin omitted)

### Community 0 - "Database & Config Layer"
Cohesion: 0.06
Nodes (61): db, pool, env, required, commentLikes, comments, commentsRelations, courseEnrollmentsRelations (+53 more)

### Community 1 - "React UI Views"
Cohesion: 0.07
Nodes (40): Canal(), Catalogo(), Configuracion(), CursoDetalle(), Favoritos(), Historial(), Login(), MisCursos() (+32 more)

### Community 2 - "API & Backend Schema"
Cohesion: 0.10
Nodes (39): OpenAPI Specification — EduVerify REST API (39 endpoints), Backend README — EduVerify API Documentation, Error Handler Middleware (ZodError/multer/generic → { status, message }), profesor_playlists DB Table (curso backbone, with orden for lesson ordering), Multer Upload Middleware (avatar 2MB / banner 5MB, JPEG/PNG/WebP only), users DB Table (rol enum, premium boolean, reset_tokens related), videos DB Table (categoria enum, es_premium, vistas, usuario_id FK), Zod Validation — Request Body and Params Schema Validation (+31 more)

### Community 3 - "Backend Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, bcrypt, cors, dotenv, drizzle-orm, express, @google/genai, jsonwebtoken (+19 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, lucide-react, react, react-dom, devDependencies, autoprefixer, eslint, @eslint/js (+18 more)

### Community 5 - "Dev Tooling & Docs"
Cohesion: 0.09
Nodes (25): graphify trigger note (.claude/CLAUDE.md), graphify skill, /graphify add command, --watch flag (folder watcher), Token reduction benchmark, FalkorDB export, graphify MCP server, Neo4j export (+17 more)

### Community 6 - "Courses & Progress System"
Cohesion: 0.14
Nodes (14): courseEnrollments, lessonProgress, quizAttempts, avatarUrl(), base(), checkLeccion(), checkQuiz(), estaInscrito() (+6 more)

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
Cohesion: 0.22
Nodes (10): configuracion view (Configuracion.jsx), login view (Login.jsx), /api/auth endpoints, /api/users endpoints, POST /api/users/me/avatar endpoint, POST /api/users/me/banner endpoint, base64-to-FormData frontend migration, Multer diskStorage config (+2 more)

### Community 11 - "Video Player & Social"
Cohesion: 0.22
Nodes (9): reproductor view (Reproductor.jsx), videos-guardados view (Playlists.jsx), /api/comments endpoints, /api/notifications endpoints, /api/playlists endpoints (student), /api/subscriptions endpoints, Phase 4 - Comments, Phase 6 - Student Playlists (+1 more)

### Community 12 - "Docker & Auth Flows"
Cohesion: 0.25
Nodes (8): Adminer service (docker-compose), MySQL 8 service (docker-compose), reset_tokens table, Google OAuth server-side verification flow, Password reset flow, Traditional register/login flow, Phase 0 - Backend Foundation, Phase 1 - Auth

### Community 13 - "Breadcrumb Navigation"
Cohesion: 0.29
Nodes (4): Breadcrumbs(), cache, getCached(), LABELS

### Community 14 - "Content & Creator Views"
Cohesion: 0.33
Nodes (7): canal view (Canal.jsx), catalogo view (Catalogo.jsx), profesor view (PanelProfesor.jsx), /api/profesor/playlists endpoints, /api/videos endpoints, Phase 2 - Videos CRUD, Phase 7 - Profesor Playlists

### Community 15 - "Brand Icon Sprites"
Cohesion: 0.29
Nodes (7): Bluesky butterfly logo icon, Discord game-controller-face logo icon, Documentation/book-with-bookmark outline icon (purple stroke), GitHub octocat/mark logo icon, Social/Documentation Icon Sprite Sheet (icons.svg), Social/community outline icon (person silhouette with star badge, purple stroke), X (formerly Twitter) logo icon

### Community 16 - "Favorites & History"
Cohesion: 0.40
Nodes (5): favoritos view (Favoritos.jsx), historial view (Historial.jsx), /api/favorites endpoints, /api/history endpoints, Phase 5 - Favorites & History

### Community 17 - "Premium & Cleanup"
Cohesion: 0.50
Nodes (4): premium view (PasarelaPrueba.jsx), /api/premium endpoints, Phase 10 - Cleanup, Phase 9 - Premium

### Community 18 - "JWT Auth Middleware"
Cohesion: 0.50
Nodes (4): Session storage change (eduverify_session), verifyToken auth middleware, JWT payload shape, requireRol role guard helper

## Knowledge Gaps
- **121 isolated node(s):** `name`, `version`, `type`, `dev`, `start` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 2 - Videos CRUD` connect `Content & Creator Views` to `Favorites & History`, `Auth & User Profile`, `Video Player & Social`, `Docker & Auth Flows`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `users table` connect `Social Activity Tables` to `JWT Auth Middleware`, `Auth & User Profile`, `Docker & Auth Flows`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Phase 1 - Auth` connect `Docker & Auth Flows` to `Premium & Cleanup`, `JWT Auth Middleware`, `Video Player & Social`, `Content & Creator Views`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `users table` (e.g. with `MySQL 8 service (docker-compose)` and `JWT payload shape`) actually correct?**
  _`users table` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _126 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Database & Config Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05518102372034956 - nodes in this community are weakly interconnected._
- **Should `React UI Views` be split into smaller, more focused modules?**
  _Cohesion score 0.07322068612391193 - nodes in this community are weakly interconnected._