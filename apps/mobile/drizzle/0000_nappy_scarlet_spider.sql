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
CREATE TABLE `program_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_program_id` text NOT NULL,
	`quantity_unit` text DEFAULT 'reps' NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_program_id`) REFERENCES `program_workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity_unit` text DEFAULT 'reps' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `program_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_session_id` text NOT NULL,
	`exercise_id` text,
	`exercise_program_id` text,
	`quantity_unit` text DEFAULT 'reps' NOT NULL,
	`exercise_name` text,
	`order_index` integer NOT NULL,
	`note` text,
	`strength_score` real,
	`strength_score_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workout_session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`exercise_program_id`) REFERENCES `program_exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `session_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`set_program_id` text,
	`order_index` integer NOT NULL,
	`target_quantity` integer,
	`quantity` integer,
	`load_unit` text DEFAULT 'kg' NOT NULL,
	`load_value` text,
	`rpe` real,
	`is_completed` integer DEFAULT false NOT NULL,
	`is_warmup` integer DEFAULT false NOT NULL,
	`note` text,
	`e1rm` real,
	`e1rm_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`set_program_id`) REFERENCES `program_sets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `program_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`program_exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`target_quantity` integer,
	`load_unit` text DEFAULT 'kg' NOT NULL,
	`load_value` text,
	`target_rpe` real,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`program_exercise_id`) REFERENCES `program_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `program_workouts` (
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
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`started_at` text NOT NULL,
	`ended_at` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`source_program_id` text,
	`note` text,
	`strength_score` real,
	`strength_score_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_program_id`) REFERENCES `program_workouts`(`id`) ON UPDATE no action ON DELETE set null
);
