CREATE TABLE `engagement` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`counterpart_id` text NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listing`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`counterpart_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_engagement_listing_pair` ON `engagement` (`listing_id`,`owner_id`,`counterpart_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_owner` ON `engagement` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_counterpart` ON `engagement` (`counterpart_id`);--> statement-breakpoint
CREATE TABLE `listing` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`city` text,
	`price_mode` text NOT NULL,
	`price_min` real,
	`price_max` real,
	`currency` text DEFAULT 'KZT' NOT NULL,
	`price_summary` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_listing_author` ON `listing` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_listing_kind_status` ON `listing` (`kind`,`status`);--> statement-breakpoint
CREATE INDEX `idx_listing_category` ON `listing` (`category`);--> statement-breakpoint
CREATE INDEX `idx_listing_created` ON `listing` (`created_at`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`telegram` text NOT NULL,
	`city` text,
	`bio` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `review` (
	`id` text PRIMARY KEY NOT NULL,
	`engagement_id` text NOT NULL,
	`author_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`rating` integer NOT NULL,
	`text` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_review_engagement_author` ON `review` (`engagement_id`,`author_id`);--> statement-breakpoint
CREATE INDEX `idx_review_subject` ON `review` (`subject_id`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);