CREATE TABLE `course_enrollments` (
	`user_id` int NOT NULL,
	`playlist_id` int NOT NULL,
	`enrolled_at` timestamp DEFAULT (now()),
	CONSTRAINT `course_enrollments_user_id_playlist_id_pk` PRIMARY KEY(`user_id`,`playlist_id`)
);
--> statement-breakpoint
CREATE TABLE `course_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`user_id` int NOT NULL,
	`estrellas` int NOT NULL,
	`texto` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_user_playlist_uq` UNIQUE(`user_id`,`playlist_id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`user_id` int NOT NULL,
	`playlist_id` int NOT NULL,
	`video_id` int NOT NULL,
	`completed_at` timestamp DEFAULT (now()),
	CONSTRAINT `lesson_progress_user_id_playlist_id_video_id_pk` PRIMARY KEY(`user_id`,`playlist_id`,`video_id`)
);
--> statement-breakpoint
ALTER TABLE `profesor_playlists` ADD `descripcion` text;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_reviews` ADD CONSTRAINT `course_reviews_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_reviews` ADD CONSTRAINT `course_reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `enrollment_playlist_id_idx` ON `course_enrollments` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `review_playlist_id_idx` ON `course_reviews` (`playlist_id`);