ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_by_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_profiles_email_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("email") ON DELETE set null ON UPDATE no action;