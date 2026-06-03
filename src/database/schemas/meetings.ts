import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import {scopeEnum} from "./roles";
import {domains, domainsEnum} from "./domains";

export const meetings = pgTable("meetings", { 
    id : uuid("id").defaultRandom().primaryKey(),
    title : text("title").notNull(),
    description : text("description"),
    venue : text("venue").notNull(),
    time : timestamp("time").notNull(),
    domain: domainsEnum("domain").references(() => domains.id, {
        onDelete: "restrict",
    }),
    scope : scopeEnum("scope").notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;