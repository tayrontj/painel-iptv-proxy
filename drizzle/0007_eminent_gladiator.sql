CREATE TYPE "public"."android_release_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "android_releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_code" integer NOT NULL,
	"version_name" varchar(80) NOT NULL,
	"apk_url" text NOT NULL,
	"apk_size_bytes" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"minimum_supported_version_code" integer,
	"mandatory" boolean DEFAULT false NOT NULL,
	"release_notes" text NOT NULL,
	"status" "android_release_status" DEFAULT 'draft' NOT NULL,
	"manifest_signature" text,
	"signing_key_id" varchar(80),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "android_releases_version_code_unique" UNIQUE("version_code")
);
