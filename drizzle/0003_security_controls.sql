CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_enrollments_email_dob` ON `enrollments` (`email`,`date_of_birth`);
--> statement-breakpoint
PRAGMA optimize;
