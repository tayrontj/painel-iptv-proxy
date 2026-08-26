CREATE TABLE `channelSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`quality` varchar(24) NOT NULL,
	`primaryUrl` text NOT NULL,
	`fallbackUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channelSources_id` PRIMARY KEY(`id`)
);
