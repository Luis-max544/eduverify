import {
  mysqlTable, int, varchar, text, boolean, timestamp,
  datetime, mysqlEnum, index, primaryKey, unique, json, decimal
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const users = mysqlTable('users', {
  id:                          int('id').primaryKey().autoincrement(),
  nombre:                      varchar('nombre', { length: 120 }).notNull(),
  email:                       varchar('email', { length: 255 }).notNull().unique(),
  password_hash:               varchar('password_hash', { length: 255 }),
  rol:                         mysqlEnum('rol', ['estudiante', 'profesor', 'creador']).notNull().default('estudiante'),
  tier:                        mysqlEnum('tier', ['free', 'premium', 'premium_plus']).notNull().default('free'),
  premium:                     boolean('premium').notNull().default(false),
  fecha_pago:                  datetime('fecha_pago'),
  membresia_docente:           boolean('membresia_docente').notNull().default(false),
  membresia_docente_expires_at: datetime('membresia_docente_expires_at'),
  canal_precio:                decimal('canal_precio', { precision: 8, scale: 2 }),
  avatar_path:                 varchar('avatar_path', { length: 500 }),
  banner_path:                 varchar('banner_path', { length: 500 }),
  google_sub:                  varchar('google_sub', { length: 255 }).unique(),
  dark_mode:                   boolean('dark_mode').notNull().default(false),
  created_at:                  timestamp('created_at').defaultNow(),
  updated_at:                  timestamp('updated_at').defaultNow().onUpdateNow(),
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
  id:             int('id').primaryKey().autoincrement(),
  usuario_id:     int('usuario_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  titulo:         varchar('titulo', { length: 255 }).notNull(),
  descripcion:    text('descripcion'),
  url_video:      varchar('url_video', { length: 1000 }),
  minio_key:      varchar('minio_key', { length: 500 }),
  thumbnail_key:  varchar('thumbnail_key', { length: 500 }),
  subtitles_key:  varchar('subtitles_key', { length: 500 }),
  status:         mysqlEnum('status', ['ready', 'uploading', 'error']).notNull().default('ready'),
  categoria:      mysqlEnum('categoria', ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']).notNull(),
  tipo:           mysqlEnum('tipo', ['grabado', 'envivo']).notNull().default('grabado'),
  es_premium:     boolean('es_premium').notNull().default(false),
  visible:        boolean('visible').notNull().default(true),
  vistas:         int('vistas').notNull().default(0),
  duracion:       varchar('duracion', { length: 20 }).default('00:00'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow().onUpdateNow(),
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
  id:           int('id').primaryKey().autoincrement(),
  user_id:      int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nombre:       varchar('nombre', { length: 255 }).notNull(),
  descripcion:  text('descripcion'),
  portada_path: varchar('portada_path', { length: 255 }),
  categoria:    mysqlEnum('categoria', ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte']),
  es_premium:   boolean('es_premium').notNull().default(false),
  precio:       decimal('precio', { precision: 8, scale: 2 }),
  created_at:   timestamp('created_at').defaultNow(),
}, (t) => [
  index('prof_playlist_user_id_idx').on(t.user_id),
]);

export const profesorPlaylistVideos = mysqlTable('profesor_playlist_videos', {
  playlist_id: int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  video_id:    int('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  orden:       int('orden').notNull().default(0),
  es_preview:  boolean('es_preview').notNull().default(false),
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

// ─── QUIZZES ──────────────────────────────────────────────────────────────────

export const quizzes = mysqlTable('quizzes', {
  id:             int('id').primaryKey().autoincrement(),
  playlist_id:    int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  video_id:       int('video_id').references(() => videos.id, { onDelete: 'cascade' }), // NULL = examen final del curso
  titulo:         varchar('titulo', { length: 255 }),
  min_aprobacion: int('min_aprobacion').notNull().default(70),
  obligatorio:    boolean('obligatorio').notNull().default(true),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => [
  index('quiz_playlist_id_idx').on(t.playlist_id),
  // MySQL no deduplica NULLs en unique: la unicidad del examen final se garantiza en código
  unique('quiz_playlist_video_uq').on(t.playlist_id, t.video_id),
]);

export const quizQuestions = mysqlTable('quiz_questions', {
  id:       int('id').primaryKey().autoincrement(),
  quiz_id:  int('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  pregunta: text('pregunta').notNull(),
  opciones: json('opciones').notNull(), // array de 2-6 strings (validado en zod)
  correcta: int('correcta').notNull(),  // índice 0-based (validado en zod)
  orden:    int('orden').notNull().default(0),
}, (t) => [
  index('qq_quiz_id_idx').on(t.quiz_id),
]);

export const quizAttempts = mysqlTable('quiz_attempts', {
  id:         int('id').primaryKey().autoincrement(),
  quiz_id:    int('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  correctas:  int('correctas').notNull(),
  total:      int('total').notNull(),
  score:      int('score').notNull(), // 0-100 redondeado
  passed:     boolean('passed').notNull().default(false),
  respuestas: json('respuestas').notNull(), // { [question_id]: opcion_index }
  created_at: timestamp('created_at').defaultNow(),
}, (t) => [
  index('qa_quiz_user_idx').on(t.quiz_id, t.user_id),
]);

// ─── PDF RESOURCES ───────────────────────────────────────────────────────────

export const pdfResources = mysqlTable('pdf_resources', {
  id:            int('id').primaryKey().autoincrement(),
  playlist_id:   int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  video_id:      int('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  filename:      varchar('filename', { length: 500 }).notNull(),
  original_name: varchar('original_name', { length: 255 }).notNull(),
  created_at:    timestamp('created_at').defaultNow(),
}, (t) => [
  unique('pdf_playlist_video_uq').on(t.playlist_id, t.video_id),
  index('pdf_playlist_id_idx').on(t.playlist_id),
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
  quizzes:     many(quizzes),
  pdfs:         many(pdfResources),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  playlist:  one(profesorPlaylists, { fields: [quizzes.playlist_id], references: [profesorPlaylists.id] }),
  video:     one(videos, { fields: [quizzes.video_id], references: [videos.id] }),
  questions: many(quizQuestions),
  attempts:  many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quiz_id], references: [quizzes.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quiz_id], references: [quizzes.id] }),
  user: one(users, { fields: [quizAttempts.user_id], references: [users.id] }),
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

// ─── CHANNEL SUBSCRIPTIONS (mini-sub por canal) ───────────────────────────────

export const channelSubscriptions = mysqlTable('channel_subscriptions', {
  subscriber_id: int('subscriber_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professor_id:  int('professor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  monto_pagado:  decimal('monto_pagado', { precision: 8, scale: 2 }).notNull(),
  expires_at:    datetime('expires_at').notNull(),
  created_at:    timestamp('created_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.subscriber_id, t.professor_id] }),
  index('ch_sub_professor_idx').on(t.professor_id),
]);

// ─── COURSE PURCHASES ─────────────────────────────────────────────────────────

export const coursePurchases = mysqlTable('course_purchases', {
  id:           int('id').primaryKey().autoincrement(),
  user_id:      int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  playlist_id:  int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  precio_pagado: decimal('precio_pagado', { precision: 8, scale: 2 }).notNull(),
  purchased_at: datetime('purchased_at').notNull(),
  refunded_at:  datetime('refunded_at'),
}, (t) => [
  unique('purchase_user_playlist_uq').on(t.user_id, t.playlist_id),
  index('purchase_playlist_idx').on(t.playlist_id),
]);

// ─── COUPONS ──────────────────────────────────────────────────────────────────

export const coupons = mysqlTable('coupons', {
  id:            int('id').primaryKey().autoincrement(),
  playlist_id:   int('playlist_id').notNull().references(() => profesorPlaylists.id, { onDelete: 'cascade' }),
  codigo:        varchar('codigo', { length: 50 }).notNull().unique(),
  descuento_pct: int('descuento_pct').notNull(),
  usos_max:      int('usos_max'),
  usos_actuales: int('usos_actuales').notNull().default(0),
  expires_at:    datetime('expires_at'),
  activo:        boolean('activo').notNull().default(true),
  created_at:    timestamp('created_at').defaultNow(),
}, (t) => [
  index('coupon_playlist_idx').on(t.playlist_id),
]);

// ─── TEACHER MEMBERSHIPS (historial) ─────────────────────────────────────────

export const teacherMemberships = mysqlTable('teacher_memberships', {
  id:         int('id').primaryKey().autoincrement(),
  user_id:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fecha_pago: datetime('fecha_pago').notNull(),
  expires_at: datetime('expires_at').notNull(),
  activa:     boolean('activa').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => [
  index('tm_user_idx').on(t.user_id),
]);

export const channelSubscriptionsRelations = relations(channelSubscriptions, ({ one }) => ({
  subscriber: one(users, { fields: [channelSubscriptions.subscriber_id], references: [users.id], relationName: 'channelSubscriber' }),
  professor:  one(users, { fields: [channelSubscriptions.professor_id], references: [users.id], relationName: 'channelProfessor' }),
}));

export const coursePurchasesRelations = relations(coursePurchases, ({ one }) => ({
  user:     one(users, { fields: [coursePurchases.user_id], references: [users.id] }),
  playlist: one(profesorPlaylists, { fields: [coursePurchases.playlist_id], references: [profesorPlaylists.id] }),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  playlist: one(profesorPlaylists, { fields: [coupons.playlist_id], references: [profesorPlaylists.id] }),
}));

export const teacherMembershipsRelations = relations(teacherMemberships, ({ one }) => ({
  user: one(users, { fields: [teacherMemberships.user_id], references: [users.id] }),
}));
