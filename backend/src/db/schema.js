import {
  mysqlTable, int, varchar, text, boolean, timestamp,
  datetime, mysqlEnum, index, primaryKey, unique
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const users = mysqlTable('users', {
  id:            int('id').primaryKey().autoincrement(),
  nombre:        varchar('nombre', { length: 120 }).notNull(),
  email:         varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }),
  rol:           mysqlEnum('rol', ['estudiante', 'profesor', 'creador']).notNull().default('estudiante'),
  premium:       boolean('premium').notNull().default(false),
  fecha_pago:    datetime('fecha_pago'),
  avatar_path:   varchar('avatar_path', { length: 500 }),
  banner_path:   varchar('banner_path', { length: 500 }),
  google_sub:    varchar('google_sub', { length: 255 }).unique(),
  dark_mode:     boolean('dark_mode').notNull().default(false),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => [
  index('email_idx').on(t.email),
  index('google_sub_idx').on(t.google_sub),
]);

// ─── PASSWORD RESET TOKENS ────────────────────────────────────────────────────

export const resetTokens = mysqlTable('reset_tokens', {
  id:         int('id').primaryKey().autoincrement(),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:      varchar('token', { length: 255 }).notNull().unique(),
  expires_at: datetime('expires_at').notNull(),
  used:       boolean('used').notNull().default(false),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── VIDEOS ──────────────────────────────────────────────────────────────────

export const videos = mysqlTable('videos', {
  id:          int('id').primaryKey().autoincrement(),
  usuario_id:  int('usuario_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  titulo:      varchar('titulo', { length: 255 }).notNull(),
  descripcion: text('descripcion'),
  url_video:   varchar('url_video', { length: 1000 }).notNull(),
  categoria:   mysqlEnum('categoria', ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']).notNull(),
  tipo:        mysqlEnum('tipo', ['grabado', 'envivo']).notNull().default('grabado'),
  es_premium:  boolean('es_premium').notNull().default(false),
  visible:      boolean('visible').notNull().default(true),
  vistas:      int('vistas').notNull().default(0),
  duracion:    varchar('duracion', { length: 20 }).default('00:00'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => [
  index('video_usuario_id_idx').on(t.usuario_id),
  index('video_categoria_idx').on(t.categoria),
]);

// ─── COMMENTS ────────────────────────────────────────────────────────────────

export const comments = mysqlTable('comments', {
  id:         int('id').primaryKey().autoincrement(),
  video_id:   int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parent_id:  int('parent_id'),
  texto:      text('texto').notNull(),
  likes:      int('likes').notNull().default(0),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => [
  index('comment_video_id_idx').on(t.video_id),
  index('comment_parent_id_idx').on(t.parent_id),
]);

// ─── COMMENT LIKES ────────────────────────────────────────────────────────────

export const commentLikes = mysqlTable('comment_likes', {
  comment_id: int('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.comment_id, t.user_id] }),
]);

// ─── STUDENT PLAYLISTS ────────────────────────────────────────────────────────

export const playlists = mysqlTable('playlists', {
  id:         int('id').primaryKey().autoincrement(),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nombre:     varchar('nombre', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => [
  index('playlist_user_id_idx').on(t.user_id),
]);

export const playlistVideos = mysqlTable('playlist_videos', {
  playlist_id: int('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  video_id:    int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  added_at:    timestamp('added_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.playlist_id, t.video_id] }),
]);

// ─── PROFESOR PLAYLISTS ───────────────────────────────────────────────────────

export const profesorPlaylists = mysqlTable('profesor_playlists', {
  id:          int('id').primaryKey().autoincrement(),
  user_id:     int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nombre:      varchar('nombre', { length: 255 }).notNull(),
  descripcion: text('descripcion'),
  created_at:  timestamp('created_at').defaultNow(),
}, (t) => [
  index('prof_playlist_user_id_idx').on(t.user_id),
]);

export const profesorPlaylistVideos = mysqlTable('profesor_playlist_videos', {
  playlist_id: int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  video_id:    int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  orden:       int('orden').notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.playlist_id, t.video_id] }),
]);

// ─── COURSE ENROLLMENTS ───────────────────────────────────────────────────────

export const courseEnrollments = mysqlTable('course_enrollments', {
  user_id:     int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  playlist_id: int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  enrolled_at: timestamp('enrolled_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.user_id, t.playlist_id] }),
  index('enrollment_playlist_id_idx').on(t.playlist_id),
]);

// ─── LESSON PROGRESS ──────────────────────────────────────────────────────────

export const lessonProgress = mysqlTable('lesson_progress', {
  user_id:      int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  playlist_id:  int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  video_id:     int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  completed_at: timestamp('completed_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.user_id, t.playlist_id, t.video_id] }),
]);

// ─── COURSE REVIEWS ───────────────────────────────────────────────────────────

export const courseReviews = mysqlTable('course_reviews', {
  id:          int('id').primaryKey().autoincrement(),
  playlist_id: int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  user_id:     int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  estrellas:   int('estrellas').notNull(),
  texto:       text('texto'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => [
  unique('review_user_playlist_uq').on(t.user_id, t.playlist_id),
  index('review_playlist_id_idx').on(t.playlist_id),
]);

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

export const subscriptions = mysqlTable('subscriptions', {
  subscriber_id:  int('subscriber_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professor_id:   int('professor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificaciones: boolean('notificaciones').notNull().default(true),
  created_at:     timestamp('created_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.subscriber_id, t.professor_id] }),
]);

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const notifications = mysqlTable('notifications', {
  id:         int('id').primaryKey().autoincrement(),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mensaje:    varchar('mensaje', { length: 500 }).notNull(),
  leida:      boolean('leida').notNull().default(false),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => [
  index('notif_user_id_idx').on(t.user_id),
]);

// ─── FAVORITES ────────────────────────────────────────────────────────────────

export const favorites = mysqlTable('favorites', {
  user_id:  int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  video_id: int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  added_at: timestamp('added_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.user_id, t.video_id] }),
]);

// ─── HISTORY ─────────────────────────────────────────────────────────────────

export const history = mysqlTable('history', {
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  video_id:   int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  watched_at: timestamp('watched_at').defaultNow().onUpdateNow(),
}, (t) => [
  primaryKey({ columns: [t.user_id, t.video_id] }),
  index('history_user_id_idx').on(t.user_id),
]);

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  videos:            many(videos),
  comments:          many(comments),
  playlists:         many(playlists),
  profesorPlaylists: many(profesorPlaylists),
  favorites:         many(favorites),
  history:           many(history),
  notifications:     many(notifications),
  resetTokens:       many(resetTokens),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  author:                one(users, { fields: [videos.usuario_id], references: [users.id] }),
  comments:              many(comments),
  playlistVideos:        many(playlistVideos),
  profesorPlaylistVideos: many(profesorPlaylistVideos),
  favorites:             many(favorites),
  history:               many(history),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  video:   one(videos, { fields: [comments.video_id], references: [videos.id] }),
  user:    one(users, { fields: [comments.user_id], references: [users.id] }),
  replies: many(comments, { relationName: 'replies' }),
  parent:  one(comments, { fields: [comments.parent_id], references: [comments.id], relationName: 'replies' }),
  likes:   many(commentLikes),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user:   one(users, { fields: [playlists.user_id], references: [users.id] }),
  videos: many(playlistVideos),
}));

export const profesorPlaylistsRelations = relations(profesorPlaylists, ({ one, many }) => ({
  user:        one(users, { fields: [profesorPlaylists.user_id], references: [users.id] }),
  videos:      many(profesorPlaylistVideos),
  enrollments: many(courseEnrollments),
  reviews:     many(courseReviews),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  user:     one(users, { fields: [courseEnrollments.user_id], references: [users.id] }),
  playlist: one(profesorPlaylists, { fields: [courseEnrollments.playlist_id], references: [profesorPlaylists.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user:     one(users, { fields: [lessonProgress.user_id], references: [users.id] }),
  playlist: one(profesorPlaylists, { fields: [lessonProgress.playlist_id], references: [profesorPlaylists.id] }),
  video:    one(videos, { fields: [lessonProgress.video_id], references: [videos.id] }),
}));

export const courseReviewsRelations = relations(courseReviews, ({ one }) => ({
  user:     one(users, { fields: [courseReviews.user_id], references: [users.id] }),
  playlist: one(profesorPlaylists, { fields: [courseReviews.playlist_id], references: [profesorPlaylists.id] }),
}));
