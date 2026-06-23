import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { activity } from "./activity";
import { profiles } from "./profiles";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "Present",
  "Absent",
]);

export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  activityId: uuid("activity_id")
    .references(() => activity.id, { onDelete: "restrict" })
    .notNull(),
  status: attendanceStatusEnum("status").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
