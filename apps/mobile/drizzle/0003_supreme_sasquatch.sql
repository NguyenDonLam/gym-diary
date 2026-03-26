ALTER TABLE `exercise_period_stats` ADD `total_rep_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `exercise_period_stats` ADD `total_set_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `exercise_stats` ADD `total_rep_count` integer DEFAULT 0 NOT NULL;