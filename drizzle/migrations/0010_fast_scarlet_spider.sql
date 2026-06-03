ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_by_profiles_email_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "assigned_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "assigned_to" SET DATA TYPE uuid[];--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_profiles_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;