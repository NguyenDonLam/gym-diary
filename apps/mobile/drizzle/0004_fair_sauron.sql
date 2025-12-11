ALTER TABLE `session_sets` ADD `is_completed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `name` text;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `status` text DEFAULT 'in_progress' NOT NULL;