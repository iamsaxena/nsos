CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`payment_status` text DEFAULT 'created' NOT NULL,
	`razorpay_order_id` text,
	`razorpay_payment_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text NOT NULL,
	`duration` text NOT NULL,
	`format` text DEFAULT 'Live on Zoom' NOT NULL,
	`mrp` integer NOT NULL,
	`offer_price` integer NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`image_key` text,
	`presentation_key` text,
	`recording_key` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
