ALTER TABLE "profiles" ALTER COLUMN "role_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DEFAULT 'member'::text;--> statement-breakpoint
DROP TYPE "public"."role_label";--> statement-breakpoint
CREATE TYPE "public"."role_label" AS ENUM('member', 'associate lead', 'co-lead', 'lead', 'human resource manager', 'vice president', 'president');--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role_id" SET DATA TYPE "public"."role_label" USING "role_id"::"public"."role_label";--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role_id" SET DATA TYPE "public"."role_label" USING "role_id"::"public"."role_label";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DEFAULT 'member'::"public"."role_label";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DATA TYPE "public"."role_label" USING "role_id"::"public"."role_label";