"use client";

import { ChevronDown, Mail, Phone, Search } from "lucide-react";
import { useState } from "react";
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

export default function MemberDirectoryClient({
  members,
}: {
  members: ApprovedMember[];
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
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
