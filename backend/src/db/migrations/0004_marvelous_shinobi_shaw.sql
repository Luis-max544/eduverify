CREATE TABLE `pdf_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`video_id` int,
	`filename` varchar(500) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pdf_resources_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdf_playlist_video_uq` UNIQUE(`playlist_id`,`video_id`)
);
--> statement-breakpoint
ALTER TABLE `pdf_resources` ADD CONSTRAINT `pdf_resources_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pdf_resources` ADD CONSTRAINT `pdf_resources_video_id_videos_id_fk` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pdf_playlist_id_idx` ON `pdf_resources` (`playlist_id`);