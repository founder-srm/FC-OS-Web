CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('pending_approval', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "status" "profile_status" DEFAULT 'pending_approval' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "decided_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_auth_user_id_unique" UNIQUE("auth_user_id");