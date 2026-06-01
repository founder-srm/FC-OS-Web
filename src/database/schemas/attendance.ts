import {pgTable, text, uuid, timestamp, pgEnum} from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { profiles } from "./profiles";

export const attendanceStatusEnum = pgEnum("attendance_status", [
    "Present",
    "Absent",
]);

export const attendance = pgTable("attendance", {
    id : uuid("id").defaultRandom().primaryKey(),
    profileId : uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
    meetingId : uuid("meeting_id").references(() => meetings.id, { onDelete: "cascade" }).notNull(),
    status : attendanceStatusEnum("status").notNull(),
    timestamp : timestamp("timestamp").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;