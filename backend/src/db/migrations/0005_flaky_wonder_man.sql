ALTER TABLE `profesor_playlists` ADD `portada_path` varchar(255);--> statement-breakpoint
ALTER TABLE `profesor_playlists` ADD `categoria` enum('Programación','Ciberseguridad','Matemáticas','Electrónica','Arte');--> statement-breakpoint
ALTER TABLE `profesor_playlists` ADD `es_premium` boolean DEFAULT false NOT NULL;