ALTER TABLE `epgSources` ADD `coverageEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `epgSources` ADD `refreshThresholdHours` int DEFAULT 6 NOT NULL;