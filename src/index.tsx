import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./drizzle/schema";

const connectionString = process.env.DATABASE_URL;

try {
  if (!connectionString) throw "No environment variable found.";
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle({ client });

  const allUsers = await db.select().from(users);
} catch (error) {
  alert(error);
}
