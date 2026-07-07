# Database Schema — EduVerify

MySQL 8. All tables use `utf8mb4` charset.

---

## ERD (text)

```
users ──< videos ──< comments ──< comment_likes
  │           │
  │           └──< playlist_videos >── playlists ──> users
  │           └──< profesor_playlist_videos >── profesor_playlists ──> users
  │           └──< favorites >── users
  │           └──< history >── users
  │
  ├──< reset_tokens
  ├──< notifications
  ├──< subscriptions (subscriber_id, professor_id both → users)
  └──< playlists
  └──< profesor_playlists
```

---

## Tables

### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| nombre | VARCHAR(120) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NULL (Google-only accounts have no password) |
| rol | ENUM('estudiante','profesor','creador') | NOT NULL, DEFAULT 'estudiante' |
| premium | BOOLEAN | NOT NULL, DEFAULT false |
| fecha_pago | DATETIME | NULL |
| avatar_path | VARCHAR(500) | NULL — relative path: `avatars/1.jpg` |
| banner_path | VARCHAR(500) | NULL — relative path: `banners/1.jpg` |
| google_sub | VARCHAR(255) | UNIQUE, NULL |
| dark_mode | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() ON UPDATE NOW() |

Indexes: `email_idx` on `email`, `google_sub_idx` on `google_sub`

---

### `reset_tokens`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| token | VARCHAR(255) | NOT NULL, UNIQUE |
| expires_at | DATETIME | NOT NULL — NOW() + 1 hour |
| used | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### `videos`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| usuario_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| titulo | VARCHAR(255) | NOT NULL |
| descripcion | TEXT | NULL |
| url_video | VARCHAR(1000) | NOT NULL |
| categoria | ENUM('Programación','Ciberseguridad','Matemáticas','Electrónica','Arte') | NOT NULL |
| tipo | ENUM('grabado','envivo') | NOT NULL, DEFAULT 'grabado' |
| es_premium | BOOLEAN | NOT NULL, DEFAULT false |
| vistas | INT | NOT NULL, DEFAULT 0 |
| duracion | VARCHAR(20) | NULL — format '15:40' |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() ON UPDATE NOW() |

Indexes: `usuario_id_idx`, `categoria_idx`

GET /api/videos response JOINs `users` to include `autor` (users.nombre) and `author_avatar_url` (users.avatar_path).

---

### `comments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| video_id | INT | NOT NULL, FK → videos.id ON DELETE CASCADE |
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| parent_id | INT | NULL — self-ref FK → comments.id. NULL = root comment |
| texto | TEXT | NOT NULL |
| likes | INT | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |

Max nesting: 2 levels (comment + replies). `parent_id` of a reply points to a root comment (parent_id IS NULL).

Indexes: `video_id_idx`, `parent_id_idx`

---

### `comment_likes`
Junction table — one row per user per comment like.

| Column | Type | Constraints |
|--------|------|-------------|
| comment_id | INT | NOT NULL, FK → comments.id ON DELETE CASCADE |
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |

PK: `(comment_id, user_id)`

Toggle logic: INSERT if not exists, DELETE if exists. Update `comments.likes` counter accordingly.

---

### `playlists` (student watch-later folders)
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| nombre | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

Index: `user_id_idx`

---

### `playlist_videos`
| Column | Type | Constraints |
|--------|------|-------------|
| playlist_id | INT | NOT NULL, FK → playlists.id ON DELETE CASCADE |
| video_id | INT | NOT NULL, FK → videos.id ON DELETE CASCADE |
| added_at | TIMESTAMP | DEFAULT NOW() |

PK: `(playlist_id, video_id)`

---

### `profesor_playlists` (course modules)
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| nombre | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

Index: `user_id_idx`

---

### `profesor_playlist_videos`
| Column | Type | Constraints |
|--------|------|-------------|
| playlist_id | INT | NOT NULL, FK → profesor_playlists.id ON DELETE CASCADE |
| video_id | INT | NOT NULL, FK → videos.id ON DELETE CASCADE |
| orden | INT | NOT NULL, DEFAULT 0 |

PK: `(playlist_id, video_id)`

---

### `subscriptions`
| Column | Type | Constraints |
|--------|------|-------------|
| subscriber_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| professor_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| notificaciones | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |

PK: `(subscriber_id, professor_id)`

---

### `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| mensaje | VARCHAR(500) | NOT NULL |
| leida | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

Index: `user_id_idx`

Insertion: server creates a notification row when a user subscribes to a professor.

---

### `favorites`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| video_id | INT | NOT NULL, FK → videos.id ON DELETE CASCADE |
| added_at | TIMESTAMP | DEFAULT NOW() |

PK: `(user_id, video_id)`

---

### `history`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | INT | NOT NULL, FK → users.id ON DELETE CASCADE |
| video_id | INT | NOT NULL, FK → videos.id ON DELETE CASCADE |
| watched_at | TIMESTAMP | DEFAULT NOW() ON UPDATE NOW() |

PK: `(user_id, video_id)`

Upsert strategy: `INSERT INTO history ... ON DUPLICATE KEY UPDATE watched_at = NOW()`
Each video appears once; ordered by `watched_at DESC` for historial view.

Index: `user_id_idx`
