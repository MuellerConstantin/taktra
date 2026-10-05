CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "clients_name_length" CHECK(length("clients"."name") <= 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_uid_unique` ON `clients` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `clients_name_unique` ON `clients` (`name_key`);--> statement-breakpoint
ALTER TABLE `activities` ADD `client_id` integer REFERENCES clients(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `client_id` integer REFERENCES clients(id);