ALTER TABLE `enrollments` ADD `date_of_birth` text;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `occupation` text;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `attendance_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `certificate_eligible_at` text;--> statement-breakpoint
ALTER TABLE `events` ADD `speaker_name` text;--> statement-breakpoint
ALTER TABLE `events` ADD `speaker_title` text;--> statement-breakpoint
ALTER TABLE `events` ADD `speaker_experience` text;--> statement-breakpoint
ALTER TABLE `events` ADD `speaker_bio` text;--> statement-breakpoint
ALTER TABLE `events` ADD `speaker_photo_key` text;