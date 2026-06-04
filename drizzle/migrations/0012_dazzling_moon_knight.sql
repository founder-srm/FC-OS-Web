ALTER TABLE "attendance" RENAME COLUMN "meeting_id" TO "activity_id";--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_meeting_id_activity_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_activity_id_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE restrict ON UPDATE no action;