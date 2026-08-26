ALTER TABLE `customers` ADD `accessTokenHash` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `vodItems` ADD `posterUrl` text;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_accessTokenHash_unique` UNIQUE(`accessTokenHash`);