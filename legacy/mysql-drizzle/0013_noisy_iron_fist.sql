ALTER TABLE `epgSources` ADD `feedUrl` text;--> statement-breakpoint
ALTER TABLE `epgSources` ADD `lastAttemptAt` timestamp;--> statement-breakpoint
ALTER TABLE `epgSources` ADD `lastError` text;