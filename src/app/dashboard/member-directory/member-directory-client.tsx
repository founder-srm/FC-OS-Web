"use client";

import {
  ChevronDown,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApprovedMember } from "@/utils/dbActions";
import { removeMember, updateMember } from "./actions";

const PAGE_SIZE = 20;

const DOMAINS = ["technical", "creatives", "operations", "outreach"] as const;
const ROLES = [
  "member",
  "associate lead",
  "co-lead",
  "lead",
  "human resource manager",
  "vice president",
  "president",
] as const;

function GenderBadge({ gender }: { gender: "male" | "female" | null }) {
  if (!gender) return null;
  const isMale = gender === "male";
  return (
    <Badge
      style={{
        backgroundColor: isMale ? "#1d4ed8" : "#be185d",
        color: "#f8fafc",
        borderColor: "transparent",
      }}
    >
      {isMale ? "Male" : "Female"}
    </Badge>
  );
}

function formatBirthday(dob: string) {
  return new Date(`${dob}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function highestRole(
  rolePairs: { role: string; domain: string | null }[],
): string {
  let best = -1;
  for (const { role } of rolePairs) {
    const idx = ROLES.indexOf(role as (typeof ROLES)[number]);
    if (idx > best) best = idx;
  }
  return best >= 0 ? capitalize(ROLES[best]) : "Club member";
}

function formatRoles(
  rolePairs: { role: string; domain: string | null }[],
): string[] {
  const result: string[] = [];
  const hasMember = rolePairs.some(
    (p) => p.domain !== null && p.role === "member",
  );
  if (hasMember) result.push("Member");
  for (const { role, domain } of rolePairs) {
    if (domain === null) {
      result.push(capitalize(role));
    } else if (role !== "member") {
      result.push(`${capitalize(role)} ${capitalize(domain)}`);
    }
  }
  return result;
}

// Roles an approver can assign per domain vs. globally (mirrors the seed scopes).
const DOMAIN_SCOPED_ROLES = [
  "member",
  "associate lead",
  "co-lead",
  "lead",
] as const;
const GLOBAL_ROLE_LIST = [
  "human resource manager",
  "vice president",
  "president",
  "advisor",
  "alumni",
] as const;

/**
 * Approver-only editor for a member's domains/roles plus soft-remove. Mounted
 * with `key={member.id}` so its draft state resets when a different member opens.
 */
function MemberManagePanel({
  member,
  onDone,
}: {
  member: ApprovedMember;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [domainRoles, setDomainRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      member.rolePairs
        .filter((p) => p.domain !== null)
        .map((p) => [p.domain as string, p.role]),
    ),
  );
  const [globalRoles, setGlobalRoles] = useState<Set<string>>(
    () =>
      new Set(
        member.rolePairs.filter((p) => p.domain === null).map((p) => p.role),
      ),
  );

  const availableDomains = DOMAINS.filter((d) => !(d in domainRoles));
  const assignmentCount = Object.keys(domainRoles).length + globalRoles.size;

  function addDomain(domain: string) {
    setDomainRoles((prev) => ({ ...prev, [domain]: "member" }));
  }

  function removeDomain(domain: string) {
    setDomainRoles((prev) => {
      const next = { ...prev };
      delete next[domain];
      return next;
    });
  }

  function toggleGlobal(role: string) {
    setGlobalRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function save() {
    const assignments = [
      ...Object.entries(domainRoles).map(([domain, role]) => ({
        role,
        domain,
      })),
      ...[...globalRoles].map((role) => ({ role, domain: "" })),
    ];
    startTransition(async () => {
      const res = await updateMember(member.id, assignments);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Member updated.");
      onDone();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeMember(member.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`${member.firstName} ${member.lastName} removed.`);
      onDone();
    });
  }

  if (!editing) {
    return (
      <div className="mt-6 flex gap-2 border-t border-border px-4 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit roles
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove {member.firstName} {member.lastName}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                They'll be set to rejected and drop off the directory. This can
                be undone from member requests.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={(e) => {
                  e.preventDefault();
                  remove();
                }}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 border-t border-border px-4 pt-4">
      <div>
        <p className="mb-2 text-sm font-medium">Domains & roles</p>
        <div className="flex flex-col gap-2">
          {Object.keys(domainRoles).length === 0 ? (
            <p className="text-sm text-muted-foreground">No domains.</p>
          ) : (
            Object.entries(domainRoles).map(([domain, role]) => (
              <div key={domain} className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">
                  {capitalize(domain)}
                </Badge>
                <Select
                  value={role}
                  onValueChange={(v) =>
                    setDomainRoles((prev) => ({ ...prev, [domain]: v }))
                  }
                  disabled={isPending}
                >
                  <SelectTrigger size="sm" className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAIN_SCOPED_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {capitalize(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  disabled={isPending}
                  aria-label={`Remove ${capitalize(domain)}`}
                  onClick={() => removeDomain(domain)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))
          )}
          {availableDomains.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Add:</span>
              {availableDomains.map((domain) => (
                <Button
                  key={domain}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  disabled={isPending}
                  onClick={() => addDomain(domain)}
                >
                  <Plus className="size-3" />
                  {capitalize(domain)}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Global roles</p>
        <div className="flex flex-wrap gap-1.5">
          {GLOBAL_ROLE_LIST.map((role) => {
            const active = globalRoles.has(role);
            return (
              <Button
                key={role}
                variant={active ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                disabled={isPending}
                onClick={() => toggleGlobal(role)}
              >
                {capitalize(role)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          disabled={isPending || assignmentCount === 0}
          onClick={save}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function MemberDirectoryClient({
  members,
  canManage,
}: {
  members: ApprovedMember[];
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ApprovedMember | null>(null);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">(
    "all",
  );
  const [domainFilters, setDomainFilters] = useState<Set<string>>(new Set());
  const [roleFilters, setRoleFilters] = useState<Set<string>>(new Set());

  function resetPage() {
    setPage(0);
  }

  function toggleDomain(domain: string) {
    setDomainFilters((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
    resetPage();
  }

  function toggleRole(role: string) {
    setRoleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
    resetPage();
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q);
    const matchesGender = genderFilter === "all" || m.gender === genderFilter;
    const matchesDomain =
      domainFilters.size === 0 || m.domains.some((d) => domainFilters.has(d));
    const matchesRole =
      roleFilters.size === 0 ||
      m.rolePairs.some((p) => roleFilters.has(p.role));
    return matchesSearch && matchesGender && matchesDomain && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>

        {/* Gender filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={genderFilter !== "all" ? "secondary" : "outline"}
              size="sm"
              className="gap-1"
            >
              {genderFilter === "all" ? "Gender" : capitalize(genderFilter)}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Gender</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={genderFilter}
              onValueChange={(v) => {
                setGenderFilter(v as "all" | "male" | "female");
                resetPage();
              }}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="male">Male</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="female">
                Female
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Domains filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={domainFilters.size > 0 ? "secondary" : "outline"}
              size="sm"
              className="gap-1"
            >
              Domains
              {domainFilters.size > 0 && (
                <Badge className="ml-0.5 h-4 px-1 text-[10px]">
                  {domainFilters.size}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Domains</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DOMAINS.map((d) => (
              <DropdownMenuCheckboxItem
                key={d}
                checked={domainFilters.has(d)}
                onCheckedChange={() => toggleDomain(d)}
              >
                {capitalize(d)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Role filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={roleFilters.size > 0 ? "secondary" : "outline"}
              size="sm"
              className="gap-1"
            >
              Role
              {roleFilters.size > 0 && (
                <Badge className="ml-0.5 h-4 px-1 text-[10px]">
                  {roleFilters.size}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLES.map((r) => (
              <DropdownMenuCheckboxItem
                key={r}
                checked={roleFilters.has(r)}
                onCheckedChange={() => toggleRole(r)}
              >
                {capitalize(r)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Domains</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-sm text-muted-foreground"
              >
                No members found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((member) => (
              <TableRow
                key={member.id}
                className="cursor-pointer"
                onClick={() => setSelected(member)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`mailto:${member.email}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`tel:${member.phone}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
                <TableCell>
                  <GenderBadge gender={member.gender} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.domains.map((d) => (
                      <Badge key={d}>{capitalize(d)}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {formatRoles(member.rolePairs).map((r) => (
                      <Badge key={r} variant="outline">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-80">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-base">
                      {initials(selected.firstName, selected.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>
                      {selected.firstName} {selected.lastName}
                    </SheetTitle>
                    <SheetDescription>
                      {highestRole(selected.rolePairs)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4 px-4">
                {selected.gender && (
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-sm text-muted-foreground">
                      Gender
                    </span>
                    <GenderBadge gender={selected.gender} />
                  </div>
                )}
                {selected.domains.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="w-20 shrink-0 pt-0.5 text-sm text-muted-foreground">
                      Domains
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selected.domains.map((d) => (
                        <Badge key={d}>{capitalize(d)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selected.rolePairs.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="w-20 shrink-0 pt-0.5 text-sm text-muted-foreground">
                      Role
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {formatRoles(selected.rolePairs).map((r) => (
                        <Badge key={r} variant="outline">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selected.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-sm text-muted-foreground">
                      Birthday
                    </span>
                    <span className="text-sm">
                      {formatBirthday(selected.dateOfBirth)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-muted-foreground">
                    Email
                  </span>
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="break-all">{selected.email}</span>
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-muted-foreground">
                    Phone
                  </span>
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {selected.phone}
                  </a>
                </div>
              </div>

              {canManage && (
                <MemberManagePanel
                  key={selected.id}
                  member={selected}
                  onDone={() => setSelected(null)}
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
