CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "customers_name_length" CHECK(length("customers"."name") <= 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_uid_unique` ON `customers` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_unique` ON `customers` (`name_key`);--> statement-breakpoint
ALTER TABLE `activities` ADD `customer_id` integer REFERENCES customers(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `customer_id` integer REFERENCES customers(id);