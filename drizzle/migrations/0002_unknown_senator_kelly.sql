CREATE TYPE "public"."scope" AS ENUM('domain', 'global');--> statement-breakpoint
CREATE TABLE "permissions" (
	"permission_id" text PRIMARY KEY NOT NULL,
	"permission_label" text NOT NULL,
	"permission_description" text,
	CONSTRAINT "permissions_permission_id_unique" UNIQUE("permission_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_role_id_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_domain_id_domains_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "domain_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "domain_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "domain_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "scope" "scope" DEFAULT 'domain' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_domain_id_domains_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("domain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_domain_id_unique" UNIQUE("domain_id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_role_id_unique" UNIQUE("role_id");
