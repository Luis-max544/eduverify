ALTER TABLE `videos` MODIFY COLUMN `url_video` varchar(1000);--> statement-breakpoint
ALTER TABLE `videos` ADD `minio_key` varchar(500);--> statement-breakpoint
ALTER TABLE `videos` ADD `thumbnail_key` varchar(500);--> statement-breakpoint
ALTER TABLE `videos` ADD `subtitles_key` varchar(500);--> statement-breakpoint
ALTER TABLE `videos` ADD `status` enum('ready','uploading','error') DEFAULT 'ready' NOT NULL;