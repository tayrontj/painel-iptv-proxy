ALTER TABLE `customers` ADD `xtreamUsername` varchar(16);--> statement-breakpoint
ALTER TABLE `customers` ADD `xtreamPasswordHash` varchar(64);--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_xtreamUsername_unique` UNIQUE(`xtreamUsername`);