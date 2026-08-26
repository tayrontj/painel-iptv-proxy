CREATE TABLE `planCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`cycle` enum('monthly','quarterly','semiannual','annual','custom') NOT NULL,
	`intervalDays` int NOT NULL,
	`discountPercent` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`monthlyPriceCents` int NOT NULL,
	`screenLimit` int NOT NULL DEFAULT 1,
	`trialDays` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vodEpisodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vodId` int NOT NULL,
	`seasonId` int,
	`episodeNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceUrl` text NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vodEpisodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vodSeasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vodId` int NOT NULL,
	`seasonNumber` int NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vodSeasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `planId` int;--> statement-breakpoint
ALTER TABLE `customers` ADD `planCycleId` int;--> statement-breakpoint
ALTER TABLE `customers` ADD `trialEndsAt` timestamp;