# Pushing Migrations

## This DB is synced with `push`, not `migrate`

There is **no `__drizzle_migrations` tracking table** in the database — schema has always
been synced with `drizzle-kit push`, which diffs the schema against the live DB and applies
changes directly. The files under `drizzle/migrations/` are generated for record/review but
are **not replayed** against the DB.

> **Do not run `drizzle-kit migrate`.** With no tracking table it replays from `0000`, hits
> "relation already exists", and fails silently (no error output). Use `push` instead.

## Workflow

1. Edit schema files under `src/database/schemas/`.
2. (Optional, for the record) generate the migration SQL:
   ```bash
   bunx drizzle-kit generate --config drizzle.config.ts
   ```
3. Apply to the DB:
   ```bash
   bunx drizzle-kit push --config drizzle.config.ts
   ```
   `push` is interactive (needs a TTY) and may prompt on ambiguous renames — answer
   carefully (a drop+create is **not** a rename).
4. Seed any new reference/default data:
   ```bash
   bun run seed
   ```

## Applying a generated SQL file directly (no TTY)

When `push` can't run interactively (CI, agent), apply the generated
`drizzle/migrations/<n>_*.sql` straight to Neon — e.g. via the Neon MCP
`run_sql_transaction` (project `dry-resonance-85705717`), or `psql`. Review the SQL first;
it may include destructive `DROP`s.
