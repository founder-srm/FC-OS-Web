CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"venue" text NOT NULL,
	"time" timestamp NOT NULL,
	"domain" "domain",
	"scope" "scope" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domains" DROP CONSTRAINT "domains_domain_id_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_role_id_unique";--> statement-breakpoint
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_permission_id_unique";--> statement-breakpoint
DROP INDEX "domains_id_unique";--> statement-breakpoint
DROP INDEX "roles_id_unique";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DEFAULT 'member';