PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_export_template_columns` (
	`template_id` integer NOT NULL,
	`position` integer NOT NULL,
	`builtin` text,
	`field_id` integer,
	`header` text,
	`aggregation` text,
	PRIMARY KEY(`template_id`, `position`),
	FOREIGN KEY (`template_id`) REFERENCES `export_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "export_template_columns_one_source" CHECK(("__new_export_template_columns"."builtin" IS NULL) <> ("__new_export_template_columns"."field_id" IS NULL)),
	CONSTRAINT "export_template_columns_builtin" CHECK("__new_export_template_columns"."builtin" IN ('date', 'project', 'activity', 'tags', 'start', 'end', 'duration_min', 'note', 'client', 'duration_h')),
	CONSTRAINT "export_template_columns_aggregation" CHECK("__new_export_template_columns"."aggregation" IN ('group', 'sum', 'list_distinct')),
	CONSTRAINT "export_template_columns_header_length" CHECK(length("__new_export_template_columns"."header") <= 50)
);
--> statement-breakpoint
INSERT INTO `__new_export_template_columns`("template_id", "position", "builtin", "field_id", "header", "aggregation") SELECT "template_id", "position", "builtin", "field_id", "header", "aggregation" FROM `export_template_columns`;--> statement-breakpoint
DROP TABLE `export_template_columns`;--> statement-breakpoint
ALTER TABLE `__new_export_template_columns` RENAME TO `export_template_columns`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `export_template_columns_field_idx` ON `export_template_columns` (`field_id`);