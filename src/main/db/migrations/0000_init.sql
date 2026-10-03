CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "activities_name_length" CHECK(length("activities"."name") <= 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_uid_unique` ON `activities` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `activities_project_name_unique` ON `activities` (`project_id`,lower("name"));--> statement-breakpoint
CREATE TABLE `activity_tags` (
	`activity_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`activity_id`, `tag_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_tags_tag_idx` ON `activity_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `properties` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "projects_name_length" CHECK(length("projects"."name") <= 50),
	CONSTRAINT "projects_description_length" CHECK(length("projects"."description") <= 500)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_uid_unique` ON `projects` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (lower("name"));--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "tags_name_length" CHECK(length("tags"."name") <= 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_uid_unique` ON `tags` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (lower("name"));--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`activity_id` integer NOT NULL,
	`date` text NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`timezone` text,
	`duration_sec` integer,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "time_entries_note_length" CHECK(length("time_entries"."note") <= 2000),
	CONSTRAINT "time_entries_kind" CHECK(("time_entries"."started_at" IS NULL AND "time_entries"."ended_at" IS NULL AND "time_entries"."timezone" IS NULL AND "time_entries"."duration_sec" IS NOT NULL AND "time_entries"."duration_sec" > 0)
        OR ("time_entries"."started_at" IS NOT NULL AND "time_entries"."timezone" IS NOT NULL AND "time_entries"."ended_at" IS NULL AND "time_entries"."duration_sec" IS NULL)
        OR ("time_entries"."started_at" IS NOT NULL AND "time_entries"."timezone" IS NOT NULL AND "time_entries"."ended_at" IS NOT NULL AND "time_entries"."ended_at" > "time_entries"."started_at" AND "time_entries"."duration_sec" IS NOT NULL AND "time_entries"."duration_sec" > 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `time_entries_uid_unique` ON `time_entries` (`uid`);--> statement-breakpoint
CREATE INDEX `time_entries_date_idx` ON `time_entries` (`date`);--> statement-breakpoint
CREATE INDEX `time_entries_activity_idx` ON `time_entries` (`activity_id`);