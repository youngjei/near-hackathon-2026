CREATE TABLE `payment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`share_id` text NOT NULL,
	`request_key` text NOT NULL,
	`method` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`mode` text DEFAULT 'demo' NOT NULL,
	FOREIGN KEY (`share_id`) REFERENCES `shares`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_request` ON `payment_attempts` (`share_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `attempts_share` ON `payment_attempts` (`share_id`);--> statement-breakpoint
CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`create_key` text NOT NULL,
	`merchant` text NOT NULL,
	`currency` text NOT NULL,
	`original_total` text NOT NULL,
	`extra` text NOT NULL,
	`diners` integer NOT NULL,
	`total_units` text NOT NULL,
	`fx_rate` text NOT NULL,
	`fx_date` text NOT NULL,
	`fx_source` text NOT NULL,
	`mode` text DEFAULT 'demo' NOT NULL,
	`receipt_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bill_creation` ON `bills` (`owner_hash`,`create_key`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_id` text NOT NULL,
	`position` integer NOT NULL,
	`amount_units` text NOT NULL,
	`token_hash` text NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `share_position` ON `shares` (`bill_id`,`position`);--> statement-breakpoint
CREATE INDEX `shares_bill` ON `shares` (`bill_id`);