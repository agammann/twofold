CREATE TABLE `public_usage` (
	`id` integer PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`used` integer NOT NULL,
	`last_started` integer NOT NULL
);
