CREATE TABLE `comment_likes` (
	`comment_id` int NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `comment_likes_comment_id_user_id_pk` PRIMARY KEY(`comment_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`video_id` int NOT NULL,
	`user_id` int NOT NULL,
	`parent_id` int,
	`texto` text NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` int NOT NULL,
	`video_id` int NOT NULL,
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `favorites_user_id_video_id_pk` PRIMARY KEY(`user_id`,`video_id`)
);
--> statement-breakpoint
CREATE TABLE `history` (
	`user_id` int NOT NULL,
	`video_id` int NOT NULL,
	`watched_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `history_user_id_video_id_pk` PRIMARY KEY(`user_id`,`video_id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`mensaje` varchar(500) NOT NULL,
	`leida` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlist_videos` (
	`playlist_id` int NOT NULL,
	`video_id` int NOT NULL,
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `playlist_videos_playlist_id_video_id_pk` PRIMARY KEY(`playlist_id`,`video_id`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profesor_playlist_videos` (
	`playlist_id` int NOT NULL,
	`video_id` int NOT NULL,
	`orden` int NOT NULL DEFAULT 0,
	CONSTRAINT `profesor_playlist_videos_playlist_id_video_id_pk` PRIMARY KEY(`playlist_id`,`video_id`)
);
--> statement-breakpoint
CREATE TABLE `profesor_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `profesor_playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`subscriber_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`notificaciones` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `subscriptions_subscriber_id_professor_id_pk` PRIMARY KEY(`subscriber_id`,`professor_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`rol` enum('estudiante','profesor','creador') NOT NULL DEFAULT 'estudiante',
	`premium` boolean NOT NULL DEFAULT false,
	`fecha_pago` datetime,
	`avatar_path` varchar(500),
	`banner_path` varchar(500),
	`google_sub` varchar(255),
	`dark_mode` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_google_sub_unique` UNIQUE(`google_sub`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descripcion` text,
	`url_video` varchar(1000) NOT NULL,
	`categoria` enum('Programación','Ciberseguridad','Matemáticas','Electrónica','Arte') NOT NULL,
	`tipo` enum('grabado','envivo') NOT NULL DEFAULT 'grabado',
	`es_premium` boolean NOT NULL DEFAULT false,
	`vistas` int NOT NULL DEFAULT 0,
	`duracion` varchar(20) DEFAULT '00:00',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comment_likes` ADD CONSTRAINT `comment_likes_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_likes` ADD CONSTRAINT `comment_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `history` ADD CONSTRAINT `history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `history` ADD CONSTRAINT `history_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlist_videos` ADD CONSTRAINT `playlist_videos_playlist_id_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlist_videos` ADD CONSTRAINT `playlist_videos_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlists` ADD CONSTRAINT `playlists_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profesor_playlist_videos` ADD CONSTRAINT `profesor_playlist_videos_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profesor_playlist_videos` ADD CONSTRAINT `profesor_playlist_videos_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profesor_playlists` ADD CONSTRAINT `profesor_playlists_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reset_tokens` ADD CONSTRAINT `reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_subscriber_id_users_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_professor_id_users_id_fk` FOREIGN KEY (`professor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videos` ADD CONSTRAINT `videos_usuario_id_users_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `comment_video_id_idx` ON `comments` (`video_id`);--> statement-breakpoint
CREATE INDEX `comment_parent_id_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `history_user_id_idx` ON `history` (`user_id`);--> statement-breakpoint
CREATE INDEX `notif_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `playlist_user_id_idx` ON `playlists` (`user_id`);--> statement-breakpoint
CREATE INDEX `prof_playlist_user_id_idx` ON `profesor_playlists` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `google_sub_idx` ON `users` (`google_sub`);--> statement-breakpoint
CREATE INDEX `video_usuario_id_idx` ON `videos` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `video_categoria_idx` ON `videos` (`categoria`);