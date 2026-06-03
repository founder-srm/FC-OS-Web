CREATE TYPE "public"."type" AS ENUM('Meeting', 'Event', 'C2C', 'Help Desk');--> statement-breakpoint
ALTER TABLE "meetings" RENAME TO "activity";--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_meeting_id_meetings_id_fk";
--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "meetings_domain_domains_domain_id_fk";
--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "type" "type" NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_meeting_id_activity_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_domain_domains_domain_id_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain_id") ON DELETE restrict ON UPDATE no action;