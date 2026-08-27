CREATE TABLE "scheduler_locks" (
	"name" varchar(80) PRIMARY KEY NOT NULL,
	"locked_until" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "primary_last_status" integer;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "primary_latency_ms" integer;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "primary_last_error" text;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "fallback_last_status" integer;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "fallback_latency_ms" integer;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "fallback_last_error" text;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "selected_route" varchar(12) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_sources" ADD COLUMN "last_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "health_status" varchar(16) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "last_health_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "health_message" text;