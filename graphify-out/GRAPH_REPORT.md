# Graph Report - .  (2026-07-17)

## Corpus Check
- 110 files · ~96,403 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 463 nodes · 882 edges · 32 communities (25 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend API & MinIO Storage|Backend API & MinIO Storage]]
- [[_COMMUNITY_Frontend React Components|Frontend React Components]]
- [[_COMMUNITY_API Documentation & OpenAPI|API Documentation & OpenAPI]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Graphify Knowledge Graph Skill|Graphify Knowledge Graph Skill]]
- [[_COMMUNITY_Database Schema & Relations|Database Schema & Relations]]
- [[_COMMUNITY_Courses, Quizzes & Progress|Courses, Quizzes & Progress]]
- [[_COMMUNITY_Comments & Seed Data|Comments & Seed Data]]
- [[_COMMUNITY_DB Schema Docs (SocialPlaylists)|DB Schema Docs (Social/Playlists)]]
- [[_COMMUNITY_Coupons, Enrollments & Purchases|Coupons, Enrollments & Purchases]]
- [[_COMMUNITY_Auth, Users & File Upload Spec|Auth, Users & File Upload Spec]]
- [[_COMMUNITY_Premium, Auth Flows & Migration|Premium, Auth Flows & Migration]]
- [[_COMMUNITY_Video Player, Playlists & Subscriptions|Video Player, Playlists & Subscriptions]]
- [[_COMMUNITY_Docker Infra (MySQL + MinIO)|Docker Infra (MySQL + MinIO)]]
- [[_COMMUNITY_Breadcrumb Navigation|Breadcrumb Navigation]]
- [[_COMMUNITY_Catalog, Canal & Profesor Views|Catalog, Canal & Profesor Views]]
- [[_COMMUNITY_Public Social Icons|Public Social Icons]]
- [[_COMMUNITY_Favorites & History|Favorites & History]]
- [[_COMMUNITY_JWT Auth & Role Guards|JWT Auth & Role Guards]]
- [[_COMMUNITY_User Avatar Assets|User Avatar Assets]]
- [[_COMMUNITY_User Banner Assets|User Banner Assets]]
- [[_COMMUNITY_Video Cover Image|Video Cover Image]]
- [[_COMMUNITY_Health Endpoint|Health Endpoint]]
- [[_COMMUNITY_Frontend README|Frontend README]]
- [[_COMMUNITY_Uploaded PDF|Uploaded PDF]]
- [[_COMMUNITY_Favicon|Favicon]]

## God Nodes (most connected - your core abstractions)
1. `db` - 19 edges
2. `graphify skill` - 18 edges
3. `verifyToken()` - 17 edges
4. `users` - 16 edges
5. `useToast()` - 16 edges
6. `env` - 15 edges
7. `users table` - 15 edges
8. `mediaUrl()` - 11 edges
9. `Backend README — EduVerify API Documentation` - 11 edges
10. `Courses Specification — Udemy-style Structured Courses on EduVerify` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Vista String State Navigation Pattern (Custom Router in App.jsx)` --semantically_similar_to--> `Express Route Order Gotcha: /mis-cursos Before /:id`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/08-courses-spec.md
- `In-memory Rate Limit (10 req/min/user, Map-based, MVP non-distributed)` --semantically_similar_to--> `Premium Gating System (boolean flag, PasarelaPrueba, POST /premium/activate)`  [INFERRED] [semantically similar]
  docs/10-ai-chat-spec.md → CLAUDE.md
- `Phase 0 - Backend Foundation` --references--> `MySQL 8 Service`  [EXTRACTED]
  docs/06-migration-phases.md → backend/docker-compose.yml
- `CLAUDE.md — Project Architecture Guide` --references--> `Backend README — EduVerify API Documentation`  [EXTRACTED]
  CLAUDE.md → backend/README.md
- `OpenAPI Specification — EduVerify REST API (39 endpoints)` --references--> `JWT Authentication System (7-day Bearer Tokens, payload: sub+email+rol+premium)`  [EXTRACTED]
  backend/openapi.yaml → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **graphify build/query pipeline** — graphify_skill_graphify, references_query_traversal, references_extraction_spec_subagent_prompt, references_update_incremental_update [EXTRACTED 1.00]
- **JWT Authentication System: Google OAuth + JWT Tokens + Role Enforcement** — eduverify_claude_google_oauth, eduverify_claude_jwt_auth, eduverify_claude_user_roles [INFERRED 0.95]
- **Avatar/banner upload flow** — docs_05_file_uploads_spec_multer_config, docs_05_file_uploads_spec_avatar_endpoint, docs_05_file_uploads_spec_banner_endpoint, docs_02_db_schema_users_table [INFERRED 0.85]
- **Auth migration (Phase 1) flow** — docs_06_migration_phases_phase1_auth, docs_04_auth_spec_traditional_auth_flow, docs_04_auth_spec_google_oauth_flow, docs_04_auth_spec_password_reset_flow, docs_04_auth_spec_auth_middleware [INFERRED 0.85]
- **Course Learning Flow: Enrollment + Lesson Progress + Reviews** — docs_08_courses_spec_course_enrollments, docs_08_courses_spec_lesson_progress, docs_09_reviews_spec_course_reviews [INFERRED 0.95]
- **AI Tutor Pipeline: Gemini SDK + Rate Limit + System Prompt + /api/ai/chat Route** — docs_10_ai_chat_spec_gemini_integration, docs_10_ai_chat_spec_rate_limit, docs_10_ai_chat_spec_system_prompt, docs_10_ai_chat_spec_ai_route [EXTRACTED 1.00]
- **EduVerify Backend Infrastructure: MySQL + Adminer + MinIO as three co-deployed Docker services** — backend_docker_compose_mysql, backend_docker_compose_adminer, backend_docker_compose_minio [EXTRACTED 1.00]
- **Persistent storage layer: mysql_data and minio_data volumes ensure data survives container restarts** — backend_docker_compose_mysql_data, backend_docker_compose_minio_data, backend_docker_compose [EXTRACTED 0.95]
- **User-uploaded binary assets stored under backend/uploads: cover images and PDF documents** — covers_1, pdfs_1783459852785_yp37ql, backend_docker_compose_minio [INFERRED 0.75]

## Communities (32 total, 7 thin omitted)

### Community 0 - "Backend API & MinIO Storage"
Cohesion: 0.05
Nodes (68): db, env, required, ensureBucket(), mediaUrl(), minioClient, PUBLIC_PREFIXES, channelSubscriptions (+60 more)

### Community 1 - "Frontend React Components"
Cohesion: 0.06
Nodes (51): Canal(), AVATAR_COLORS, Catalogo(), CATEGORIAS, Configuracion(), CursoDetalle(), Favoritos(), Historial() (+43 more)

### Community 2 - "API Documentation & OpenAPI"
Cohesion: 0.10
Nodes (39): OpenAPI Specification — EduVerify REST API (39 endpoints), Backend README — EduVerify API Documentation, Error Handler Middleware (ZodError/multer/generic → { status, message }), profesor_playlists DB Table (curso backbone, with orden for lesson ordering), Multer Upload Middleware (avatar 2MB / banner 5MB, JPEG/PNG/WebP only), users DB Table (rol enum, premium boolean, reset_tokens related), videos DB Table (categoria enum, es_premium, vistas, usuario_id FK), Zod Validation — Request Body and Params Schema Validation (+31 more)

### Community 3 - "Backend Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, bcrypt, cors, dotenv, drizzle-orm, express, @google/genai, jsonwebtoken (+21 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, lucide-react, react, react-dom, devDependencies, autoprefixer, eslint, @eslint/js (+18 more)

### Community 5 - "Graphify Knowledge Graph Skill"
Cohesion: 0.09
Nodes (25): graphify trigger note (.claude/CLAUDE.md), graphify skill, /graphify add command, --watch flag (folder watcher), Token reduction benchmark, FalkorDB export, graphify MCP server, Neo4j export (+17 more)

### Community 6 - "Database Schema & Relations"
Cohesion: 0.09
Nodes (22): channelSubscriptionsRelations, commentLikes, commentsRelations, couponsRelations, courseEnrollmentsRelations, coursePurchasesRelations, courseReviewsRelations, favorites (+14 more)

### Community 7 - "Courses, Quizzes & Progress"
Cohesion: 0.15
Nodes (13): courseReviews, quizAttempts, quizQuestions, quizzes, CATEGORIAS, checkLeccion(), checkQuiz(), estaInscrito() (+5 more)

### Community 8 - "Comments & Seed Data"
Cohesion: 0.21
Nodes (15): pool, comments, bulkInsert(), CATEGORIAS, clean(), dedup(), dur(), genComment() (+7 more)

### Community 9 - "DB Schema Docs (Social/Playlists)"
Cohesion: 0.26
Nodes (12): comment_likes table, comments table, favorites table, history table, notifications table, playlist_videos table, playlists table (student folders), profesor_playlist_videos table (+4 more)

### Community 10 - "Coupons, Enrollments & Purchases"
Cohesion: 0.22
Nodes (7): coupons, courseEnrollments, lessonProgress, profesorPlaylists, couponSchema, router, router

### Community 11 - "Auth, Users & File Upload Spec"
Cohesion: 0.22
Nodes (10): configuracion view (Configuracion.jsx), login view (Login.jsx), /api/auth endpoints, /api/users endpoints, POST /api/users/me/avatar endpoint, POST /api/users/me/banner endpoint, base64-to-FormData frontend migration, Multer diskStorage config (+2 more)

### Community 12 - "Premium, Auth Flows & Migration"
Cohesion: 0.22
Nodes (9): premium view (PasarelaPrueba.jsx), reset_tokens table, /api/premium endpoints, Google OAuth server-side verification flow, Password reset flow, Traditional register/login flow, Phase 10 - Cleanup, Phase 1 - Auth (+1 more)

### Community 13 - "Video Player, Playlists & Subscriptions"
Cohesion: 0.22
Nodes (9): reproductor view (Reproductor.jsx), videos-guardados view (Playlists.jsx), /api/comments endpoints, /api/notifications endpoints, /api/playlists endpoints (student), /api/subscriptions endpoints, Phase 4 - Comments, Phase 6 - Student Playlists (+1 more)

### Community 14 - "Docker Infra (MySQL + MinIO)"
Cohesion: 0.36
Nodes (7): Adminer DB Admin UI Service, MinIO Object Storage Service (S3-compatible), minio_data Docker Volume, MinIO chosen as S3-compatible self-hosted object storage for videos, PDFs, and course assets; avoids external cloud storage dependency while keeping an S3 API surface, MySQL 8 Service, mysql_data Docker Volume, Phase 0 - Backend Foundation

### Community 15 - "Breadcrumb Navigation"
Cohesion: 0.29
Nodes (4): Breadcrumbs(), cache, getCached(), LABELS

### Community 16 - "Catalog, Canal & Profesor Views"
Cohesion: 0.33
Nodes (7): canal view (Canal.jsx), catalogo view (Catalogo.jsx), profesor view (PanelProfesor.jsx), /api/profesor/playlists endpoints, /api/videos endpoints, Phase 2 - Videos CRUD, Phase 7 - Profesor Playlists

### Community 17 - "Public Social Icons"
Cohesion: 0.29
Nodes (7): Bluesky butterfly logo icon, Discord game-controller-face logo icon, Documentation/book-with-bookmark outline icon (purple stroke), GitHub octocat/mark logo icon, Social/Documentation Icon Sprite Sheet (icons.svg), Social/community outline icon (person silhouette with star badge, purple stroke), X (formerly Twitter) logo icon

### Community 18 - "Favorites & History"
Cohesion: 0.40
Nodes (5): favoritos view (Favoritos.jsx), historial view (Historial.jsx), /api/favorites endpoints, /api/history endpoints, Phase 5 - Favorites & History

### Community 19 - "JWT Auth & Role Guards"
Cohesion: 0.50
Nodes (4): Session storage change (eduverify_session), verifyToken auth middleware, JWT payload shape, requireRol role guard helper

## Knowledge Gaps
- **137 isolated node(s):** `name`, `version`, `type`, `dev`, `start` (+132 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 1 - Auth` connect `Premium, Auth Flows & Migration` to `Catalog, Canal & Profesor Views`, `JWT Auth & Role Guards`, `Video Player, Playlists & Subscriptions`, `Docker Infra (MySQL + MinIO)`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `Phase 2 - Videos CRUD` connect `Catalog, Canal & Profesor Views` to `Favorites & History`, `Auth, Users & File Upload Spec`, `Premium, Auth Flows & Migration`, `Video Player, Playlists & Subscriptions`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `users table` connect `DB Schema Docs (Social/Playlists)` to `Auth, Users & File Upload Spec`, `JWT Auth & Role Guards`, `Premium, Auth Flows & Migration`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend API & MinIO Storage` be split into smaller, more focused modules?**
  _Cohesion score 0.05120883304778222 - nodes in this community are weakly interconnected._
- **Should `Frontend React Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05727605727605728 - nodes in this community are weakly interconnected._
- **Should `API Documentation & OpenAPI` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._