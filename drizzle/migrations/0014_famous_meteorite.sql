ALTER TABLE "profiles" DROP CONSTRAINT "profiles_role_id_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_domain_id_domains_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "domain_id";