# Graph Report - .  (2026-07-06)

## Corpus Check
- Corpus is ~37,442 words - fits in a single context window. You may not need a graph.

## Summary
- 276 nodes · 427 edges · 27 communities (24 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 168,000 input · 16,925 output

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
- [[_COMMUNITY_Health Check Endpoint|Health Check Endpoint]]
- [[_COMMUNITY_Sidebar Quirk|Sidebar Quirk]]
- [[_COMMUNITY_App Favicon Icon|App Favicon Icon]]

## God Nodes (most connected - your core abstractions)
1. `graphify skill` - 19 edges
2. `users table` - 17 edges
3. `env` - 15 edges
4. `db` - 12 edges
5. `users` - 11 edges
6. `verifyToken()` - 11 edges
7. `Phase 1 - Auth` - 8 edges
8. `videos` - 7 edges
9. `Phase 2 - Videos CRUD` - 7 edges
10. `scripts` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Video creation/selection flow` --semantically_similar_to--> `profesor view (PanelProfesor.jsx)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/01-feature-spec.md
- `localStorage persistence keys` --semantically_similar_to--> `Session storage change (eduverify_session)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/01-feature-spec.md
- `Simulated client-side auth` --semantically_similar_to--> `Traditional register/login flow`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/04-auth-spec.md
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

## Communities (27 total, 3 thin omitted)

### Community 0 - "DB Schema & Backend Tables"
Cohesion: 0.08
Nodes (37): Adminer service (docker-compose), MySQL 8 service (docker-compose), premium view (PasarelaPrueba.jsx), Session storage change (eduverify_session), comment_likes table, comments table, favorites table, history table (+29 more)

### Community 1 - "Frontend Views (vista state)"
Cohesion: 0.08
Nodes (29): canal view (Canal.jsx), catalogo view (Catalogo.jsx), configuracion view (Configuracion.jsx), favoritos view (Favoritos.jsx), historial view (Historial.jsx), login view (Login.jsx), profesor view (PanelProfesor.jsx), reproductor view (Reproductor.jsx) (+21 more)

### Community 2 - "Frontend View Components"
Cohesion: 0.11
Nodes (13): Canal(), Catalogo(), Configuracion(), Favoritos(), Historial(), Login(), Navbar(), PanelProfesor() (+5 more)

### Community 3 - "Graphify Skill Docs"
Cohesion: 0.08
Nodes (26): graphify trigger note (.claude/CLAUDE.md), graphify project integration rules, graphify skill, /graphify add command, --watch flag (folder watcher), Token reduction benchmark, FalkorDB export, graphify MCP server (+18 more)

### Community 4 - "Frontend Package Config"
Cohesion: 0.08
Nodes (25): dependencies, react, react-dom, devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks (+17 more)

### Community 5 - "Backend Package Config"
Cohesion: 0.08
Nodes (24): dependencies, bcrypt, cors, dotenv, drizzle-orm, express, jsonwebtoken, multer (+16 more)

### Community 6 - "Drizzle ORM Schema Relations"
Cohesion: 0.18
Nodes (9): commentsRelations, playlists, playlistsRelations, playlistVideos, profesorPlaylistsRelations, resetTokens, usersRelations, videosRelations (+1 more)

### Community 7 - "Video History DB Module"
Cohesion: 0.25
Nodes (8): db, pool, history, users, base(), formatVideo(), router, router

### Community 8 - "Auth & Env Config"
Cohesion: 0.31
Nodes (5): env, required, sendPasswordReset(), transporter, verifyGoogleCredential()

### Community 9 - "Comments Backend Module"
Cohesion: 0.22
Nodes (7): commentLikes, comments, errorHandler(), router, router, router, app

### Community 10 - "File Upload Backend Module"
Cohesion: 0.29
Nodes (7): ALLOWED_TYPES, uploadAvatar, uploadBanner, avatarUrl(), bannerUrl(), formatUser(), uploadsBase()

### Community 11 - "Notifications & Subscriptions"
Cohesion: 0.36
Nodes (5): notifications, subscriptions, verifyToken(), router, router

### Community 12 - "Teacher Playlists Backend"
Cohesion: 0.29
Nodes (3): profesorPlaylists, profesorPlaylistVideos, router

### Community 13 - "UI Icon Sprite Set"
Cohesion: 0.29
Nodes (7): Bluesky butterfly logo icon, Discord game-controller-face logo icon, Documentation/book-with-bookmark outline icon (purple stroke), GitHub octocat/mark logo icon, Social/Documentation Icon Sprite Sheet (icons.svg), Social/community outline icon (person silhouette with star badge, purple stroke), X (formerly Twitter) logo icon

### Community 14 - "Favorites Backend Module"
Cohesion: 0.40
Nodes (5): favorites, videos, base(), formatVideo(), router

### Community 15 - "Videos Backend Module"
Cohesion: 0.40
Nodes (5): requireRol(), base(), CATEGORIAS, formatVideo(), router

### Community 16 - "App Stack & Entry Point"
Cohesion: 0.67
Nodes (3): EduVerify stack (React 19 + Vite 8 + Tailwind 3), index.html app entry (#root, main.jsx), React + Vite starter template

## Knowledge Gaps
- **92 isolated node(s):** `name`, `version`, `type`, `dev`, `start` (+87 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `users table` connect `DB Schema & Backend Tables` to `Frontend Views (vista state)`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Phase 2 - Videos CRUD` connect `Frontend Views (vista state)` to `DB Schema & Backend Tables`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Phase 1 - Auth` connect `DB Schema & Backend Tables` to `Frontend Views (vista state)`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `users table` (e.g. with `MySQL 8 service (docker-compose)` and `JWT payload shape`) actually correct?**
  _`users table` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _96 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DB Schema & Backend Tables` be split into smaller, more focused modules?**
  _Cohesion score 0.07507507507507508 - nodes in this community are weakly interconnected._
- **Should `Frontend Views (vista state)` be split into smaller, more focused modules?**
  _Cohesion score 0.07881773399014778 - nodes in this community are weakly interconnected._