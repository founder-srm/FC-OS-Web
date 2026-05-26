ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_permissions_permission_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_role_id_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_domain_id_domains_domain_id_fk";
--> statement-breakpoint
DROP INDEX "domains_label_unique";--> statement-breakpoint
DROP INDEX "roles_label_unique";--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "domain_id" SET DATA TYPE "public"."domain" USING "domain_id"::"public"."domain";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role_id" SET DATA TYPE "public"."role_label" USING "role_id"::"public"."role_label";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "domain_id" SET DATA TYPE "public"."domain" USING "domain_id"::"public"."domain";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "role_id" SET DATA TYPE "public"."role_label" USING "role_id"::"public"."role_label";--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role_id" SET DATA TYPE "public"."role_label" USING "role_id"::"public"."role_label";--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_domain_id_domains_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("domain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("permission_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "domains_id_unique" ON "domains" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_id_unique" ON "roles" USING btree ("role_id");--> statement-breakpoint
ALTER TABLE "domains" DROP COLUMN "label";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "label";
