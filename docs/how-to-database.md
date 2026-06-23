# Database Docs
1. Put all of your schemas under `@/src/database/schemas`.
2. Define individual tables in their own file, re-export from `index.ts`.
3. Refer [here](pushing-migrations.md) for applying schema changes — this DB syncs via
   `drizzle-kit push`, **not** `migrate`.
4. When you generate migrations (for the record), they appear under `@/drizzle/migrations`.
