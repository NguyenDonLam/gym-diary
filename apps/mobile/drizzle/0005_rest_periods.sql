ALTER TABLE `program_sets` ADD `rest_seconds` integer DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE `session_sets` ADD `rest_seconds` integer DEFAULT 120 NOT NULL;
