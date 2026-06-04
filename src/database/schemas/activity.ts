import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import {scopeEnum} from "./roles";
import {domains, domainsEnum} from "./domains";

export const activityEnum = pgEnum("type", [
    "Meeting",
    "Event",
    "C2C",
    "Help Desk",
]);

export const activity = pgTable("activity", { 
    id : uuid("id").defaultRandom().primaryKey(),
    title : text("title").notNull(),
    description : text("description"),
    venue : text("venue").notNull(),
    time : timestamp("time").notNull(),
    domain: domainsEnum("domain").references(() => domains.id, {
        onDelete: "restrict",
    }),
    type : activityEnum("type").notNull(),
    scope : scopeEnum("scope").notNull(),
});

export type Activity = typeof activity.$inferSelect;
export type NewActivity = typeof activity.$inferInsert;