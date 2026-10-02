CREATE TABLE `activity_tags` (
	`activity_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`activity_id`, `tag_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_tags_tag_idx` ON `activity_tags` (`tag_id`);