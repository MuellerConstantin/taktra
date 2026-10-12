CREATE TABLE `export_template_columns` (
	`template_id` integer NOT NULL,
	`position` integer NOT NULL,
	`builtin` text,
	`field_id` integer,
	`header` text,
	PRIMARY KEY(`template_id`, `position`),
	FOREIGN KEY (`template_id`) REFERENCES `export_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "export_template_columns_one_source" CHECK(("export_template_columns"."builtin" IS NULL) <> ("export_template_columns"."field_id" IS NULL)),
	CONSTRAINT "export_template_columns_builtin" CHECK("export_template_columns"."builtin" IN ('date', 'project', 'activity', 'tags', 'start', 'end', 'duration_min', 'note', 'client')),
	CONSTRAINT "export_template_columns_header_length" CHECK(length("export_template_columns"."header") <= 50)
);
--> statement-breakpoint
CREATE INDEX `export_template_columns_field_idx` ON `export_template_columns` (`field_id`);--> statement-breakpoint
CREATE TABLE `export_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`format` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "export_templates_name_length" CHECK(length("export_templates"."name") <= 50),
	CONSTRAINT "export_templates_format" CHECK("export_templates"."format" IN ('csv', 'json'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `export_templates_uid_unique` ON `export_templates` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `export_templates_name_unique` ON `export_templates` (`name_key`);