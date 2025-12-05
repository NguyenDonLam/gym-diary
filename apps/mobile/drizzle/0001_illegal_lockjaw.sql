CREATE TABLE `template_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `session_exercises` ADD `exercise_id` text NOT NULL REFERENCES exercises(id);--> statement-breakpoint
ALTER TABLE `workout_templates` ADD `folder_id` text REFERENCES template_folders(id);--> statement-breakpoint
ALTER TABLE `workout_templates` ADD `color` text DEFAULT 'neutral' NOT NULL;