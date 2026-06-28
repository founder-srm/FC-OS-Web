# FC OS — Maintainability & Refactor Plan

## Context

FC OS has grown to ~11k lines of app source across 7 dashboard tools, with Opus under
active development. A full-codebase scan (3 parallel Explore passes + spot verification)
surfaced recurring patterns that raise maintenance cost and bug risk: **no single source
of truth** for roles/domains (re-hardcoded in 6+ files), **no test harness**, **no env
validation**, **duplicated action/error scaffolding**, a few **oversized components**, and
one **confirmed authorization gap** (any approved member can read any domain's task via
`loadTaskDetailAction`). None of this blocks features today, but each new tool/feature
multiplies the duplication.

Goal: land low-risk, high-leverage foundation work first (centralization, env, shared
types, tests), close the correctness/security gaps, then decompose the heavy components —
all without changing product behavior except the intended auth tightening.

Verified during scan:
- `loadTaskDetailAction` (`src/app/dashboard/opus/actions.ts:147-150`) — auth-only, no
  domain gate. Confirmed cross-domain read. **In scope, P0.**
- `leadershipRoles` (`src/lib/utils.ts:8-12`) is an exact duplicate of `APPROVER_ROLES`
  (`src/lib/auth/context.ts:10-14`). Confirmed.
- `user_roles.id` is the `user_id` FK (`src/database/schemas/user_roles.ts:7`) — confusing
  name but correct, **not** a bug. Leave as-is.

---

## P0 — Correctness & Security (do first, small, high-value)

### 1. Gate `loadTaskDetailAction` by domain
`src/app/dashboard/opus/actions.ts:147-150`. Currently `getAccessContext()` only.
Reuse existing `getTaskAuthInfo()` + `canManageDomain()`/`canEditTask()`
(`src/lib/opus/permissions.ts`) — same pattern the write actions already use
(see `createTaskAction` at `actions.ts:153-162`). Fetch the task's domain, return `null`
if `!canManageDomain(ctx, domain)` (or approver). No new helpers needed.

### 2. Error handling at the dbActions trust boundary
`src/utils/dbActions.ts`, `src/utils/opusDbActions.ts` have zero try/catch — raw DB
errors propagate into Server Actions. Add a small `logError(scope, err)` util
(`src/lib/log.ts`) and wrap the action layer (not every db fn) so failures log the real
error server-side and return the existing `{ error }` shape to the client. Apply the
pattern in `opus/actions.ts`, `member-directory/actions.ts`, `member-requests/actions.ts`,
`onboarding/actions.ts` — the generic `catch { return {error:"…"} }` blocks currently
swallow detail (`onboarding/actions.ts:36-40`, `components/Login.tsx:56-68`).

### 3. Validate domain enum at read boundary
`src/utils/opusDbActions.ts` casts `as DomainId` unchecked (lines ~600, 638, 650, 659,
668, 678, 687). Reuse the existing `isDomainId()` guard (`src/lib/opus/format.ts`) instead
of bare casts so corrupted/unknown domain values fail loud rather than silently bypassing
domain-scoped auth.

---

## P1 — Foundation (single source of truth + safety nets)

### 4. Centralize roles/domains constants — `src/lib/constants.ts`
Derive from the DB enums (`rolesEnum`, `domainsEnum` in `src/database/schemas/roles.ts`,
`domains.ts`) and export the role *sets* once. Replace the duplicated definitions in:
- `src/lib/auth/context.ts:10-21` (`APPROVER_ROLES`, `DOMAIN_LEAD_ROLES`, `READ_ONLY_ROLES`)
- `src/lib/utils.ts:8-12` (`leadershipRoles` — delete, re-export approver set)
- `src/app/dashboard/member-directory/actions.ts:22-36` (`GLOBAL_ROLES`, `APPROVER_ROLES`)
- `src/app/dashboard/member-requests/actions.ts` (`VALID_ROLES`, `RoleAssignment`)
- `src/app/dashboard/member-directory/member-directory-client.tsx:68-77` (`DOMAINS`,`ROLES`)
- `src/app/dashboard/member-requests/member-request-row.tsx:19-36` (`DOMAIN_LABELS`,`ROLES`)
- `src/lib/validation/onboarding.ts:13-18` (`DOMAIN_IDS`)
Keep human-readable label maps (domain → display name) in the same file.

### 5. Shared action-result type — `src/lib/action-result.ts`
One `ActionResult` / `CreateResult<T>` `= { ok:true } | { error:string }`. Replace the
4 near-identical local copies: `ActionResult`/`CreateResult` (opus/actions.ts:41-42),
`ManageResult` (member-directory/actions.ts:13), `DecisionResult`
(member-requests/actions.ts:14), `SettingsResult` (profile/actions.ts:8).

### 6. Zod env schema — `src/lib/env.ts`
Validate all env at startup (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
SMTP_*, `MAIL_FROM`, `NEXT_PUBLIC_SITE_URL`). Replace scattered raw `process.env` reads in
`src/database/db.ts`, `src/lib/auth/server.ts`, `src/app/layout.tsx`. Aligns with the
deferred `APP_ENV` toggle plan — structure the schema so that var can slot in later.

### 7. Test harness — Vitest
No tests exist. Add `vitest` + `bun run test` script. Seed coverage on the pure logic that
the refactors touch: permissions (`canManageDomain`/`canEditTask`), `format.ts`
(`isDomainId`, `initials`, status logic), role-set membership, env parsing. This makes the
P2 component splits safe to do.

### 8. Cleanups
- Remove unused `motion` dep from `package.json` (no imports anywhere).
- Delete dead commented notification block `src/app/dashboard/page.tsx:56-79`.
- Dedupe `initials()` — keep `format.ts:31-32`, drop the copy in
  `member-directory-client.tsx:104-106`.

---

## P2 — Component decomposition (behavior-preserving, test-backed by P1)

### 9. Split `member-directory-client.tsx` (788 lines)
Extract `MemberFilterBar`, `MemberTable`, `MemberDetailSheet`, and
`MemberManagePanel` (itself → `DomainRoleEditor` + `GlobalRolePicker` +
`MemberActionButtons`). Pull filtering (`lines 436-449`) into a pure `filterMembers()` /
`useMemberFilters` hook. Replace inline-style `GenderBadge` (lines 84-89) and the
`paddingLeft` search input (line 468) with shadcn-consistent components.

### 10. De-duplicate Opus dialogs & pickers
- Shared `useActionRunner` hook for the duplicated `run()` in `manage-client.tsx`
  (lines 79-88 & 274-283) — toast-on-error/success + `router.refresh()`.
- `MultiSelectPicker<T>` generic backing both `assignee-picker.tsx` and `label-picker.tsx`
  (identical Popover/Command structure).
- Centralize task form value↔DTO conversion (`toDTO`/`dtoToValues` in
  `task-fields-dialog.tsx`, `toValues` in `task-detail-dialog.tsx`) into one module;
  flatten the recursive `TaskFieldsDialog`-inside-itself into a `SubtaskEditor`.
- Reuse the server `taskInputSchema` (`opus/actions.ts:46-71`) client-side instead of the
  parallel `toDTO` transform.
- `ColorPicker` shadcn wrapper for the raw `<input type="color">` (manage-client.tsx
  169-181, 299-310, 337-345) — satisfies the shadcn-only rule.

### 11. `DomainMetaContext`
Replace the `meta: DomainMeta` prop-drill through
`KanbanBoard→Column→SortableCard→TaskCard` (+ dialogs) with a context provider.

### 12. Convention pass (low urgency, document don't enforce-all-at-once)
Write the canonical tool-folder shape (`_components/`, `actions.ts`) to
`docs/architecture.md` and add `error.tsx` to the dashboard tool segments (only
`dashboard/loading.tsx` exists today; zero `error.tsx`).

---

## Out of scope (flagged, not executing now)
- tsconfig strictness (`allowJs`, `skipLibCheck`) — defer until codebase stabilizes.
- Stub tools (mom/attendance/fc-tv-cms/performance) restructure — wait until built out.

---

## Verification
- `bun run lint` + `bun run build` clean after each phase.
- `bun run test` (new) green; permissions/format/env unit tests cover the refactored logic.
- Manual: sign in as a domain member, confirm `loadTaskDetailAction` now returns `null`
  for another domain's task (P0 #1); confirm own-domain task detail still loads.
- Grep check: after P1 #4, `rg "human resource manager"` should hit only
  `src/lib/constants.ts` + the DB schema, not 6 files.
- Run `/graphify --update` is **not** needed for code (post-commit hook rebuilds the graph);
  run it only if `docs/architecture.md` is touched in #12.
