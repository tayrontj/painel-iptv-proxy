CREATE TABLE `integrationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`label` varchar(120) NOT NULL,
	`baseUrl` varchar(500),
	`enabled` boolean NOT NULL DEFAULT false,
	`secretCiphertext` text,
	`secretIv` varchar(48),
	`secretTag` varchar(48),
	`secretHint` varchar(8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrationSettings_provider_unique` UNIQUE(`provider`)
);
