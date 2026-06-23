ALTER TYPE "public"."role_label" ADD VALUE 'advisor';--> statement-breakpoint
ALTER TYPE "public"."role_label" ADD VALUE 'alumni';--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"domain_leads_can_approve" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
