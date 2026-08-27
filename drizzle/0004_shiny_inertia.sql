ALTER TABLE "customers" ALTER COLUMN "xtream_username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "xtream_password_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_xtream_password_hash_unique" UNIQUE("xtream_password_hash");