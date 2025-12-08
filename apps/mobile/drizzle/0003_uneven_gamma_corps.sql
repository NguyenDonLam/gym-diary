ALTER TABLE `template_exercises` RENAME TO `program_exercises`;--> statement-breakpoint
ALTER TABLE `template_folders` RENAME TO `program_folders`;--> statement-breakpoint
ALTER TABLE `template_sets` RENAME TO `program_sets`;--> statement-breakpoint
ALTER TABLE `workout_templates` RENAME TO `program_workouts`;--> statement-breakpoint
ALTER TABLE `program_exercises` RENAME COLUMN "workout_template_id" TO "workout_program_id";--> statement-breakpoint
ALTER TABLE `program_sets` RENAME COLUMN "template_exercise_id" TO "program_exercise_id";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_program_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_program_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_program_id`) REFERENCES `program_workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_program_exercises`("id", "workout_program_id", "exercise_id", "order_index", "note", "created_at", "updated_at") SELECT "id", "workout_program_id", "exercise_id", "order_index", "note", "created_at", "updated_at" FROM `program_exercises`;--> statement-breakpoint
DROP TABLE `program_exercises`;--> statement-breakpoint
ALTER TABLE `__new_program_exercises` RENAME TO `program_exercises`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_program_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`program_exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`target_reps` integer,
	`load_unit` text DEFAULT 'custom' NOT NULL,
	`load_value` text,
	`target_rpe` real,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`program_exercise_id`) REFERENCES `program_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_program_sets`("id", "program_exercise_id", "order_index", "target_reps", "load_unit", "load_value", "target_rpe", "note", "created_at", "updated_at") SELECT "id", "program_exercise_id", "order_index", "target_reps", "load_unit", "load_value", "target_rpe", "note", "created_at", "updated_at" FROM `program_sets`;--> statement-breakpoint
DROP TABLE `program_sets`;--> statement-breakpoint
ALTER TABLE `__new_program_sets` RENAME TO `program_sets`;--> statement-breakpoint
CREATE TABLE `__new_program_workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`folder_id` text,
	`color` text DEFAULT 'neutral' NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `program_folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_program_workouts`("id", "name", "folder_id", "color", "description", "created_at", "updated_at") SELECT "id", "name", "folder_id", "color", "description", "created_at", "updated_at" FROM `program_workouts`;--> statement-breakpoint
DROP TABLE `program_workouts`;--> statement-breakpoint
ALTER TABLE `__new_program_workouts` RENAME TO `program_workouts`;--> statement-breakpoint
CREATE TABLE `__new_session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_session_id` text NOT NULL,
	`exercise_id` text,
	`exercise_program_id` text,
	`exercise_name` text,
	`order_index` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`exercise_program_id`) REFERENCES `program_exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_session_exercises`("id", "workout_session_id", "exercise_id", "exercise_program_id", "exercise_name", "order_index", "note", "created_at", "updated_at") SELECT "id", "workout_session_id", "exercise_id", "exercise_program_id", "exercise_name", "order_index", "note", "created_at", "updated_at" FROM `session_exercises`;--> statement-breakpoint
DROP TABLE `session_exercises`;--> statement-breakpoint
ALTER TABLE `__new_session_exercises` RENAME TO `session_exercises`;--> statement-breakpoint
CREATE TABLE `__new_session_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`set_program_id` text,
	`order_index` integer NOT NULL,
	`reps` integer,
	`load_unit` text DEFAULT 'custom' NOT NULL,
	`load_value` text,
	`rpe` real,
	`is_warmup` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`set_program_id`) REFERENCES `program_sets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_session_sets`("id", "session_exercise_id", "set_program_id", "order_index", "reps", "load_unit", "load_value", "rpe", "is_warmup", "note", "created_at", "updated_at") SELECT "id", "session_exercise_id", "set_program_id", "order_index", "reps", "load_unit", "load_value", "rpe", "is_warmup", "note", "created_at", "updated_at" FROM `session_sets`;--> statement-breakpoint
DROP TABLE `session_sets`;--> statement-breakpoint
ALTER TABLE `__new_session_sets` RENAME TO `session_sets`;--> statement-breakpoint
CREATE TABLE `__new_workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`source_program_id` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_program_id`) REFERENCES `program_workouts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_workout_sessions`("id", "started_at", "ended_at", "source_program_id", "note", "created_at", "updated_at") SELECT "id", "started_at", "ended_at", "source_program_id", "note", "created_at", "updated_at" FROM `workout_sessions`;--> statement-breakpoint
DROP TABLE `workout_sessions`;--> statement-breakpoint
ALTER TABLE `__new_workout_sessions` RENAME TO `workout_sessions`;