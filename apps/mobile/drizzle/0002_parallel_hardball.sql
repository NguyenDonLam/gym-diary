PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_template_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_template_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_template_exercises`("id", "workout_template_id", "exercise_id", "order_index", "note", "created_at", "updated_at") SELECT "id", "workout_template_id", "exercise_id", "order_index", "note", "created_at", "updated_at" FROM `template_exercises`;--> statement-breakpoint
DROP TABLE `template_exercises`;--> statement-breakpoint
ALTER TABLE `__new_template_exercises` RENAME TO `template_exercises`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_template_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`template_exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`target_reps` integer,
	`load_unit` text NOT NULL,
	`load_value` text,
	`target_rpe` real,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`template_exercise_id`) REFERENCES `template_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_template_sets`("id", "template_exercise_id", "order_index", "target_reps", "load_unit", "load_value", "target_rpe", "note", "created_at", "updated_at") SELECT "id", "template_exercise_id", "order_index", "target_reps", "load_unit", "load_value", "target_rpe", "note", "created_at", "updated_at" FROM `template_sets`;--> statement-breakpoint
DROP TABLE `template_sets`;--> statement-breakpoint
ALTER TABLE `__new_template_sets` RENAME TO `template_sets`;--> statement-breakpoint
CREATE TABLE `__new_session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_session_id` text NOT NULL,
	`exercise_id` text,
	`template_exercise_id` text,
	`exercise_name` text,
	`order_index` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_exercise_id`) REFERENCES `template_exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_session_exercises`("id", "workout_session_id", "exercise_id", "template_exercise_id", "exercise_name", "order_index", "note", "created_at", "updated_at") SELECT "id", "workout_session_id", "exercise_id", "template_exercise_id", "exercise_name", "order_index", "note", "created_at", "updated_at" FROM `session_exercises`;--> statement-breakpoint
DROP TABLE `session_exercises`;--> statement-breakpoint
ALTER TABLE `__new_session_exercises` RENAME TO `session_exercises`;--> statement-breakpoint
CREATE TABLE `__new_session_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`template_set_id` text,
	`order_index` integer NOT NULL,
	`reps` integer,
	`load_unit` text NOT NULL,
	`load_value` text,
	`rpe` real,
	`is_warmup` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_set_id`) REFERENCES `template_sets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_session_sets`("id", "session_exercise_id", "template_set_id", "order_index", "reps", "load_unit", "load_value", "rpe", "is_warmup", "note", "created_at", "updated_at") SELECT "id", "session_exercise_id", "template_set_id", "order_index", "reps", "load_unit", "load_value", "rpe", "is_warmup", "note", "created_at", "updated_at" FROM `session_sets`;--> statement-breakpoint
DROP TABLE `session_sets`;--> statement-breakpoint
ALTER TABLE `__new_session_sets` RENAME TO `session_sets`;--> statement-breakpoint
CREATE TABLE `__new_workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`source_template_id` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_workout_sessions`("id", "started_at", "ended_at", "source_template_id", "note", "created_at", "updated_at") SELECT "id", "started_at", "ended_at", "source_template_id", "note", "created_at", "updated_at" FROM `workout_sessions`;--> statement-breakpoint
DROP TABLE `workout_sessions`;--> statement-breakpoint
ALTER TABLE `__new_workout_sessions` RENAME TO `workout_sessions`;