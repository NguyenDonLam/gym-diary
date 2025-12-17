ALTER TABLE `session_sets` RENAME COLUMN "reps" TO "target_quantity";--> statement-breakpoint
ALTER TABLE `program_sets` RENAME COLUMN "target_reps" TO "target_quantity";