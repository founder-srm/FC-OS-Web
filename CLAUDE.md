# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

FC OS is the **Founders Club operating system** — one Next.js app that houses every
internal club tool behind a single dashboard and auth/approval gate. Tools live under
`src/app/dashboard/`: **MoM**, **Attendance Tracker**, **FC TV CMS**, **Performance
Tracker**, **Member Directory** (approvers edit roles/domains + remove members),
**Member Requests** (HRM admin), and **Opus** — the PM
tool that is the current focus of active development. Users are
club members.

## Commands

```bash
bun install              # Bun is the package manager + lockfile source of truth
bun run dev              # next dev
bun run build            # next build
bun run lint             # biome check  (lint)
bun run format           # biome format --write
bun run seed             # tsx src/database/seed.ts

bunx drizzle-kit generate --config drizzle.config.ts   # generate migration from schema changes
bunx drizzle-kit migrate  --config drizzle.config.ts   # apply migrations
```

- **Never commit** `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` (Bun only).
- Lint/format is **Biome**, not ESLint/Prettier.

## Reference docs (keep this file lean — link, don't inline)

- **Database / migrations workflow**: `docs/how-to-database.md`, `docs/pushing-migrations.md`
- **Next.js 16 specifics**: `AGENTS.md` + `node_modules/next/dist/docs/` — this is a
  newer Next than your training data (e.g. `middleware.ts` is now `proxy.ts`).

## Architecture

Stack: Next.js 16 (App Router, RSC) · React 19 · Drizzle ORM on Neon Postgres · Neon
Auth (Better Auth) · Tailwind v4 · Zod v4.

Full detail lives in **`docs/architecture.md`** — read the relevant `###` section before
touching that area:

- **`### Auth + onboarding/approval flow`** — passwordless OTP, `proxy.ts` gating, the
  two-stage onboarding/approval state machine, and the `force-dynamic` requirement.
- **`### RBAC`** — `roles`/`permissions`/`user_roles` model, the
  `isApprover`/`isDomainLead`/`isReadOnly` flags + `requireWriteAccess` guard, the
  `app_settings` domain-lead approval toggle, where to enforce authorization.
- **`### Data layer`** — schema-per-file convention, `dbActions.ts` trust boundary,
  `db.batch()` (no interactive transactions on neon-http).
- **`### App structure`** — gated dashboard shell, `dashboard-nav.ts`, Opus.

## UI components

**Use only shadcn/ui components for the entire app.** Build UI from primitives in
`src/components/ui/` (Card, Button, Badge, Avatar, Sidebar, ScrollArea, DropdownMenu,
etc.). Need a component that isn't installed? Add it with `bunx shadcn@latest add <name>`
— do not hand-roll or pull in another component library. Config: `components.json`
(style `radix-nova`, icons `lucide-react`). Non-UI libs for behavior are fine when no
shadcn equivalent exists (e.g. `@dnd-kit` for drag-and-drop).
