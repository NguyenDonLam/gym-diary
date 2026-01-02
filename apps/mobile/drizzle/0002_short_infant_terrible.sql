CREATE TABLE `program_period_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`period_type` text NOT NULL,
	`period_start` integer NOT NULL,
	`session_count` integer DEFAULT 0 NOT NULL,
	`volume_kg` real DEFAULT 0 NOT NULL,
	`duration_sec` integer DEFAULT 0 NOT NULL,
	`average_progression` real DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `program_workouts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `program_stats` (
	`program_id` text PRIMARY KEY NOT NULL,
	`total_session_count` integer DEFAULT 0 NOT NULL,
	`total_set_count` integer DEFAULT 0 NOT NULL,
	`total_rep_count` integer DEFAULT 0 NOT NULL,
	`total_volume_kg` real DEFAULT 0 NOT NULL,
	`total_duration_sec` integer DEFAULT 0 NOT NULL,
	`median_progression` real,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `program_workouts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `exercise_stats` ADD `best_set_e1rm` real;--> statement-breakpoint
ALTER TABLE `exercise_stats` ADD `best_exercise_strength_score` real;--> statement-breakpoint
ALTER TABLE `exercise_stats` ADD `total_set_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `exercise_stats` ADD `total_volume_kg` real DEFAULT 0 NOT NULL;