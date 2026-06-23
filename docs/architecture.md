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
`member` → `president`, plus read-only `advisor` / `alumni`, each `domain`- or
`global`-scoped), `permissions`, `role_permissions`, and `user_roles` (a user's role per
domain — multi-domain membership = one row per domain). Domains: `technical`, `creatives`,
`operations`, `outreach`.

`AccessContext` (`context.ts`) derives three role flags:

- **`isApprover`** — HRM / VP / President (`APPROVER_ROLES`); the sidebar hides
  `requiresApprover` items from everyone else. Approvers also manage approved members
  directly from the **Member Directory**: `updateMember` (edit domains/roles, reusing
  `setMemberRoles`) and `removeMember` (soft-delete → `status = "rejected"` via
  `setMemberDecision`) in `member-directory/actions.ts`. Guarded against self-lockout —
  an approver cannot strip their own approver role or remove themselves. Directory
  management is approver-only; domain leads are **not** granted it (unlike the request
  flow's `domainLeadsCanApprove`).
- **`isDomainLead`** — `lead` / `co-lead` (`DOMAIN_LEAD_ROLES`). When an approver enables
  the `domainLeadsCanApprove` setting, domain leads may approve pending members **in their
  own domain only** (`decideMember` intersects the applicant's domains with
  `ctx.domainIds`; the Member Requests page filters its list the same way).
- **`isReadOnly`** — `advisor` / `alumni` (`READ_ONLY_ROLES`): full view access, no
  mutations.

**Enforce authorization inside the Server Action** — proxy/layout gating is not
sufficient for mutations. Every mutating Server Action must gate through
`requireWriteAccess()` (rejects read-only roles), then check any capability flag it needs
(e.g. `member-requests/actions.ts`, `member-directory/actions.ts` — both gate on
`ctx.isApprover`). The one exception is `onboarding/actions.ts`, which runs pre-profile
(no roles yet).

App-wide settings live in the singleton `app_settings` table (one row, `id = 1`); read via
`getAppSettings()`, written via `setDomainLeadsCanApprove()`. Approvers toggle
`domainLeadsCanApprove` from the **profile page** settings modal
(`dashboard/profile/settings-dialog.tsx`).

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
  `isApprover` and `canApproveMembers` (approver or enabled domain lead) to `AppSidebar`.
- `src/lib/dashboard-nav.ts` — single source of truth for sidebar nav (sections, hrefs,
  `requiresApprover`, `disabled`/`Soon` flags). Add tools here.
- `src/app/dashboard/member-directory/page.tsx` — lists approved members; passes
  `canManage` (`ctx.isApprover`) to the client, which gates the per-member edit/remove
  panel in the detail sheet.
- Opus (`/dashboard/opus`) is the per-domain kanban task manager — see `### Opus` below
  for the data model. The page is currently a stub; build the workspace against that schema.

### Opus

Per-domain kanban PM tool. Schema is **fully data-driven and domain-scoped** so adding a
domain (a row in `domains`) lights up Opus for it with zero code changes — re-run
`bun run seed` to populate that domain's defaults. Schema lives in
`src/database/schemas/opus_*.ts`:

- **`opus_statuses`** / **`opus_priorities`** — per-domain kanban columns / priority levels.
  Both carry `position` (ordering), `isDefault` (seeded rows, protected from deletion at the
  app layer), and a `unique(domain, name)` constraint (enables idempotent seeding). Defaults
  seeded per domain: statuses Backlog/Todo/In Progress/Done/Cancelled; priorities
  Urgent/High/Medium/Low. **"No Priority" is not a row** — it's `priority_id IS NULL`.
- **`opus_labels`** — per-domain custom labels (`name` + `color` hex). No defaults, no order.
- **`opus_tasks`** — the task table. `parent_task_id` self-FK (cascade) models sub-tasks;
  null = top-level. One-level nesting is enforced at the **app layer**, not the DB. Sub-task
  due dates inherit the parent's at the app layer. `status_id`/`priority_id` are FK
  **`restrict`** (can't delete a status/priority while tasks reference it); `priority_id`
  nullable; `created_by` FK **`set null`**; `position` orders cards within a column.
- **`opus_task_assignees`** / **`opus_task_labels`** — many-to-many junctions (composite PK),
  replacing the old array column. **`opus_task_links`** — references/URLs per task.

Authorization is **not** in the schema — enforce in Server Actions via the `user_roles`
row for the task's domain (member = edit only tasks assigned to them; lead/co-lead/associate
lead = manage their domain's tasks + statuses/priorities/labels; above-leads = full access).
