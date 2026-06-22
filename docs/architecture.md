# Architecture

**Stack**: Next.js 16 (App Router, RSC) · React 19 · Drizzle ORM on Neon Postgres
(`@neondatabase/serverless`, `neon-http` driver) · Neon Auth (Better Auth) · Tailwind v4
· Zod v4.

### Auth + onboarding/approval flow

Auth is **passwordless email OTP** via Neon Auth. There is no signup — the first OTP
sign-in auto-creates the auth user.

- `src/lib/auth/server.ts` — singleton `auth` (`createNeonAuth`); exposes `.handler()`
  (API route), `.middleware()` (proxy), and `getSession()`.
- `src/lib/auth/client.ts` — browser `authClient`; OTP send + verify (`src/components/Login.tsx`).
- `src/app/api/auth/[...path]` — Neon Auth route handler.
- `src/proxy.ts` — gates **only** `/dashboard/*`, redirecting anonymous users to `/login`.
  Server Action POSTs (`next-action` header) are passed through untouched — running them
  through the session-refreshing middleware corrupts the action response. `/onboarding`
  and `/pending` are deliberately excluded and self-guard at the page level.
- `src/lib/auth/context.ts` — `getAuthState()` / `getAccessContext()` resolve the
  `AuthState` (`unauthenticated` | `no-profile` | `active` + `AccessContext`) from the
  session joined to `profiles` + `user_roles`.

The **two-stage gate**: (1) `proxy.ts` blocks anonymous traffic; (2) `dashboard/layout.tsx`
enforces the state machine — `no-profile` → `/onboarding`, status ≠ `approved` →
`/pending`. New members land in `pending_approval`; an approver decides via
**Member Requests**.

> **CRITICAL**: any RSC / Server Action / Route Handler that calls `auth.getSession()`
> (directly or via `getAuthState`) **must** set `export const dynamic = "force-dynamic"`.

### RBAC

Role/permission model is data-driven in the schema: `roles` (enum `role_label` from
`member` → `president`, each `domain`- or `global`-scoped), `permissions`,
`role_permissions`, and `user_roles` (a user's role per domain — multi-domain membership
= one row per domain). Domains: `technical`, `creatives`, `operations`, `outreach`.

Approver gating currently keys off `isApprover` in `AccessContext` (HRM / VP / President,
see `APPROVER_ROLES` in `context.ts`); the sidebar hides `requiresApprover` items
accordingly. **Enforce authorization inside the Server Action** (e.g.
`member-requests/actions.ts` checks `ctx.isApprover`) — proxy/layout gating is not
sufficient for mutations.

### Data layer

- Schemas: one table per file in `src/database/schemas/`, re-exported from `index.ts`;
  `db` is configured in `src/database/db.ts`. Drizzle config: `drizzle.config.ts`
  (migrations output to `drizzle/migrations`).
- `src/utils/dbActions.ts` owns the actual SQL (query + write helpers). Server Actions in
  `**/actions.ts` own the trust boundary: **Zod validation + authorization check first**,
  then call a `dbActions` helper.
- The `neon-http` driver has **no interactive transactions** — use `db.batch([...])` for
  atomic multi-statement writes (see `onboardProfile`).

### App structure

- `src/app/dashboard/layout.tsx` — the gated shell (sidebar + breadcrumb), passes
  `isApprover` to `AppSidebar`.
- `src/lib/dashboard-nav.ts` — single source of truth for sidebar nav (sections, hrefs,
  `requiresApprover`, `disabled`/`Soon` flags). Add tools here.
- POD (`/dashboard/POD`) is currently a stub page; its data model is the `tasks` schema
  (status enum, domain, `assignedBy` / `assignedTo[]`, deadline). Build the Opus/POD
  workspace against it.
