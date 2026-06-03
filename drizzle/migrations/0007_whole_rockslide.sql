CREATE TYPE "public"."status" AS ENUM('Not Started', 'In Progress', 'Completed', 'On Hold');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"status" "status" DEFAULT 'Not Started',
	"description" text,
	"assigned_by" text NOT NULL,
	"assigned_to" text[],
	"deadline" timestamp NOT NULL,
	"attachment" text,
	"domain" "domain"
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_profiles_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_domain_domains_domain_id_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain_id") ON DELETE restrict ON UPDATE no action;