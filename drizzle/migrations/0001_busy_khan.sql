ALTER TABLE "profiles" DROP CONSTRAINT "profiles_role_id_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_domain_id_domains_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "label" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "domain_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "label" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_domain_id_domains_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("domain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "domains_label_unique" ON "domains" USING btree ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_label_unique" ON "roles" USING btree ("label");