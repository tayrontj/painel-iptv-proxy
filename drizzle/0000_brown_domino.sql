CREATE TYPE "public"."customer_status" AS ENUM('active', 'attention', 'expired');--> statement-breakpoint
CREATE TYPE "public"."cycle_kind" AS ENUM('monthly', 'quarterly', 'semiannual', 'annual', 'custom');--> statement-breakpoint
CREATE TYPE "public"."epg_status" AS ENUM('healthy', 'attention', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."pix_status" AS ENUM('pending', 'approved', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vod_kind" AS ENUM('filme', 'serie', 'novela');--> statement-breakpoint
CREATE TYPE "public"."vod_status" AS ENUM('draft', 'ready');--> statement-breakpoint
CREATE TABLE "channel_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"quality" varchar(24) NOT NULL,
	"primary_url" text NOT NULL,
	"primary_origin" varchar(500),
	"primary_referer" varchar(500),
	"fallback_url" text,
	"fallback_origin" varchar(500),
	"fallback_referer" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_number" integer NOT NULL,
	"name" varchar(140) NOT NULL,
	"group_title" varchar(90) NOT NULL,
	"epg_id" varchar(160),
	"logo_url" text,
	"qualities" varchar(120) NOT NULL,
	"age_rating" integer DEFAULT 0 NOT NULL,
	"route_count" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"device_name" varchar(120) NOT NULL,
	"device_key_hash" varchar(64) NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_devices_device_key_hash_unique" UNIQUE("device_key_hash")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(90) NOT NULL,
	"email" varchar(320),
	"phone" varchar(30),
	"plan" varchar(64) NOT NULL,
	"plan_id" integer,
	"plan_cycle_id" integer,
	"screen_limit" integer DEFAULT 1 NOT NULL,
	"used_screens" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"access_token_hash" varchar(64) NOT NULL,
	"xtream_username" varchar(16),
	"xtream_password_hash" varchar(64),
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_access_token_hash_unique" UNIQUE("access_token_hash"),
	CONSTRAINT "customers_xtream_username_unique" UNIQUE("xtream_username")
);
--> statement-breakpoint
CREATE TABLE "epg_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"feed_url" text,
	"status" "epg_status" DEFAULT 'inactive' NOT NULL,
	"programme_count" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"coverage_ends_at" timestamp with time zone,
	"refresh_threshold_hours" integer DEFAULT 6 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(64) NOT NULL,
	"label" varchar(120) NOT NULL,
	"base_url" varchar(500),
	"enabled" boolean DEFAULT false NOT NULL,
	"secret_ciphertext" text,
	"secret_iv" varchar(48),
	"secret_tag" varchar(48),
	"secret_hint" varchar(8),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_settings_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "pix_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "pix_status" DEFAULT 'pending' NOT NULL,
	"provider_payment_id" varchar(120),
	"external_reference" varchar(160),
	"qr_code" text,
	"qr_code_base64" text,
	"due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"cycle" "cycle_kind" NOT NULL,
	"interval_days" integer NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"screen_limit" integer DEFAULT 1 NOT NULL,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"password_hash" varchar(256),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE TABLE "vod_episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"vod_id" integer NOT NULL,
	"season_id" integer,
	"episode_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_url" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vod_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"kind" "vod_kind" NOT NULL,
	"release_year" integer,
	"source_url" text,
	"synopsis" text,
	"poster_url" text,
	"age_rating" integer DEFAULT 0 NOT NULL,
	"status" "vod_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vod_seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"vod_id" integer NOT NULL,
	"season_number" integer NOT NULL,
	"title" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
