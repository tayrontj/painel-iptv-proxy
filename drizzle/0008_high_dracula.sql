CREATE TABLE `customerDevices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`deviceName` varchar(120) NOT NULL,
	`deviceKeyHash` varchar(64) NOT NULL,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerDevices_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerDevices_deviceKeyHash_unique` UNIQUE(`deviceKeyHash`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `customers` ADD `phone` varchar(30);