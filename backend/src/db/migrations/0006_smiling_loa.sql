CREATE TABLE `channel_subscriptions` (
	`subscriber_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`monto_pagado` decimal(8,2) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `channel_subscriptions_subscriber_id_professor_id_pk` PRIMARY KEY(`subscriber_id`,`professor_id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`descuento_pct` int NOT NULL,
	`usos_max` int,
	`usos_actuales` int NOT NULL DEFAULT 0,
	`expires_at` datetime,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `course_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`playlist_id` int NOT NULL,
	`precio_pagado` decimal(8,2) NOT NULL,
	`purchased_at` datetime NOT NULL,
	`refunded_at` datetime,
	CONSTRAINT `course_purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_user_playlist_uq` UNIQUE(`user_id`,`playlist_id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`fecha_pago` datetime NOT NULL,
	`expires_at` datetime NOT NULL,
	`activa` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `teacher_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `profesor_playlist_videos` ADD `es_preview` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profesor_playlists` ADD `precio` decimal(8,2);--> statement-breakpoint
ALTER TABLE `users` ADD `tier` enum('free','premium','premium_plus') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `membresia_docente` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `membresia_docente_expires_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `canal_precio` decimal(8,2);--> statement-breakpoint
ALTER TABLE `channel_subscriptions` ADD CONSTRAINT `channel_subscriptions_subscriber_id_users_id_fk` FOREIGN KEY (`subscriber_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_subscriptions` ADD CONSTRAINT `channel_subscriptions_professor_id_users_id_fk` FOREIGN KEY (`professor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_purchases` ADD CONSTRAINT `course_purchases_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_purchases` ADD CONSTRAINT `course_purchases_playlist_id_profesor_playlists_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `profesor_playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_memberships` ADD CONSTRAINT `teacher_memberships_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ch_sub_professor_idx` ON `channel_subscriptions` (`professor_id`);--> statement-breakpoint
CREATE INDEX `coupon_playlist_idx` ON `coupons` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `purchase_playlist_idx` ON `course_purchases` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `tm_user_idx` ON `teacher_memberships` (`user_id`);