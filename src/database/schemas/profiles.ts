import {
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female"]);

// Application-level approval gate. New members land in `pending_approval` and
// only reach the dashboard once an HRM / leadership member approves them.
export const profileStatusEnum = pgEnum("profile_status", [
  "pending_approval",
  "approved",
  "rejected",
]);

export const profiles = pgTable("profiles", {
  // App-side user id. Stable primary key referenced across the app; kept even
  // though auth identity lives in Better Auth's `user` table (see `authUserId`).
  id: uuid("user_id").defaultRandom().primaryKey(),
  // Maps this profile to its Better Auth user (`user.id`). Set during
  // onboarding; null only for legacy/placeholder rows.
  authUserId: uuid("auth_user_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").unique().notNull(),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  // Approval state machine + audit of the deciding HRM/leadership user.
  status: profileStatusEnum("status").notNull().default("pending_approval"),
  approvedBy: uuid("approved_by"),
  decidedAt: timestamp("decided_at"),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
