CREATE INDEX `idx_enrollments_event_id` ON `enrollments` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_events_status_date` ON `events` (`status`,`event_date`);--> statement-breakpoint
PRAGMA optimize;
