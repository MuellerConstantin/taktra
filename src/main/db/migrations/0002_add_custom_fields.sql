CREATE TABLE `activity_field_values` (
	`activity_id` integer NOT NULL,
	`field_id` integer NOT NULL,
	`text_value` text,
	`option_id` integer,
	PRIMARY KEY(`activity_id`, `field_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`option_id`) REFERENCES `custom_field_options`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "activity_field_values_one_value" CHECK(("activity_field_values"."text_value" IS NULL) <> ("activity_field_values"."option_id" IS NULL)),
	CONSTRAINT "activity_field_values_text_length" CHECK(length("activity_field_values"."text_value") <= 200)
);
--> statement-breakpoint
CREATE INDEX `activity_field_values_field_idx` ON `activity_field_values` (`field_id`);--> statement-breakpoint
CREATE TABLE `client_field_values` (
	`client_id` integer NOT NULL,
	`field_id` integer NOT NULL,
	`text_value` text,
	`option_id` integer,
	PRIMARY KEY(`client_id`, `field_id`),
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`option_id`) REFERENCES `custom_field_options`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "client_field_values_one_value" CHECK(("client_field_values"."text_value" IS NULL) <> ("client_field_values"."option_id" IS NULL)),
	CONSTRAINT "client_field_values_text_length" CHECK(length("client_field_values"."text_value") <= 200)
);
--> statement-breakpoint
CREATE INDEX `client_field_values_field_idx` ON `client_field_values` (`field_id`);--> statement-breakpoint
CREATE TABLE `custom_field_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`field_id` integer NOT NULL,
	`label` text NOT NULL,
	`label_key` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "custom_field_options_label_length" CHECK(length("custom_field_options"."label") <= 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_field_options_uid_unique` ON `custom_field_options` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `custom_field_options_field_label_unique` ON `custom_field_options` (`field_id`,`label_key`);--> statement-breakpoint
CREATE TABLE `custom_fields` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`scope` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "custom_fields_name_length" CHECK(length("custom_fields"."name") <= 50),
	CONSTRAINT "custom_fields_scope" CHECK("custom_fields"."scope" IN ('project', 'client', 'activity')),
	CONSTRAINT "custom_fields_type" CHECK("custom_fields"."type" IN ('text', 'select'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_fields_uid_unique` ON `custom_fields` (`uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `custom_fields_scope_name_unique` ON `custom_fields` (`scope`,`name_key`);--> statement-breakpoint
CREATE TABLE `project_field_values` (
	`project_id` integer NOT NULL,
	`field_id` integer NOT NULL,
	`text_value` text,
	`option_id` integer,
	PRIMARY KEY(`project_id`, `field_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`option_id`) REFERENCES `custom_field_options`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "project_field_values_one_value" CHECK(("project_field_values"."text_value" IS NULL) <> ("project_field_values"."option_id" IS NULL)),
	CONSTRAINT "project_field_values_text_length" CHECK(length("project_field_values"."text_value") <= 200)
);
--> statement-breakpoint
CREATE INDEX `project_field_values_field_idx` ON `project_field_values` (`field_id`);