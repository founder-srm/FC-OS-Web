CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domains_slug_unique" UNIQUE("slug"),
	CONSTRAINT "domains_slug_format_check" CHECK ("domains"."slug" ~ '^[a-z0-9_]+$')
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text GENERATED ALWAYS AS ("first_name" || ' ' || "last_name") STORED NOT NULL,
	"net_id" varchar(6) NOT NULL,
	"email" text GENERATED ALWAYS AS ("net_id" || '@srmist.edu.in') STORED NOT NULL,
	"phone" varchar(13) NOT NULL,
	"role_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	CONSTRAINT "profiles_net_id_unique" UNIQUE("net_id"),
	CONSTRAINT "profiles_net_id_format_check" CHECK ("profiles"."net_id" ~ '^[a-z]{2}[0-9]{4}$'),
	CONSTRAINT "profiles_phone_format_check" CHECK ("profiles"."phone" ~ '^\+91[6-9][0-9]{9}$')
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"level" integer DEFAULT 0 NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "roles_slug_format_check" CHECK ("roles"."slug" ~ '^[a-z0-9_]+$'),
	CONSTRAINT "roles_level_range_check" CHECK ("roles"."level" >= 0 AND "roles"."level" <= 100)
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "profiles_role_id_idx" ON "profiles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "profiles_domain_id_idx" ON "profiles" USING btree ("domain_id");
