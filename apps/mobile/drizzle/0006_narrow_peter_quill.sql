CREATE TABLE `exercise_period_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`period_type` text NOT NULL,
	`period_start` integer NOT NULL,
	`session_count` integer DEFAULT 0 NOT NULL,
	`best_strength_score` real,
	`median_strength_score` real,
	`best_set_e1rm` real,
	`median_set_e1rm` real,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercise_stats` (
	`exercise_id` text PRIMARY KEY NOT NULL,
	`baseline_exercise_strength_score` real,
	`baseline_set_e1rm` real,
	`sample_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `session_exercises` ADD `strength_score` real;--> statement-breakpoint
ALTER TABLE `session_exercises` ADD `strength_score_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `session_sets` ADD `e1rm` real;--> statement-breakpoint
ALTER TABLE `session_sets` ADD `e1rm_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `strength_score` real;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `strength_score_version` integer DEFAULT 1 NOT NULL;