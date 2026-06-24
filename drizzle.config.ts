import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the .env file");
}

export default defineConfig({
  schema: "./src/database/schemas", // Your schema file path
  out: "./drizzle/migrations", // Your migrations folder
  dialect: "postgresql",
  dbCredentials: {
    // SSL comes from the connection string (`?sslmode=`); localhost needs none.
    url: process.env.DATABASE_URL,
  },
});
