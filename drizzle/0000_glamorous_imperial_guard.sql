CREATE TABLE `game_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`game_json` text NOT NULL,
	`player_count` integer DEFAULT 1 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`ended` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
