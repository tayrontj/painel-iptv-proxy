CREATE TABLE "epg_programmes" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"channel_epg_id" varchar(160) NOT NULL,
	"title" varchar(255) NOT NULL,
	"synopsis" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"age_rating" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "epg_programmes_source_channel_start_unique" ON "epg_programmes" USING btree ("source_id","channel_epg_id","starts_at");