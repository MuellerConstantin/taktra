PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_export_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`format` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "export_templates_name_length" CHECK(length("__new_export_templates"."name") <= 50),
	CONSTRAINT "export_templates_format" CHECK("__new_export_templates"."format" IN ('csv', 'json', 'xlsx'))
);
--> statement-breakpoint
INSERT INTO `__new_export_templates`("id", "uid", "name", "name_key", "format", "created_at", "updated_at") SELECT "id", "uid", "name", "name_key", "format", "created_at", "updated_at" FROM `export_templates`;--> statement-breakpoint
DROP TABLE `export_templates`;--> statement-breakpoint
ALTER TABLE `__new_export_templates` RENAME TO `export_templates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `export_templates_uid_unique` ON `export_templates` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `export_templates_name_unique` ON `export_templates` (`name_key`);