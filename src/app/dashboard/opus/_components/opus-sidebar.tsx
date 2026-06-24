"use client";

import {
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DOMAIN_IDS,
  type DomainId,
  domainIcons,
  formatDomain,
} from "@/lib/opus/format";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

function DomainGroup({
  title,
  icon: Icon,
  base,
  domains,
  pathname,
  defaultOpen,
}: {
  title: string;
  icon: LucideIcon;
  base: string;
  domains: readonly DomainId[];
  pathname: string;
  defaultOpen?: boolean;
}) {
  const anyActive = domains.some((d) => pathname === `${base}/${d}`);
  return (
    <Collapsible defaultOpen={defaultOpen ?? anyActive}>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-accent/50">
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5 space-y-0.5 pl-3">
        {domains.map((d) => (
          <NavLink
            key={d}
            href={`${base}/${d}`}
            active={pathname === `${base}/${d}`}
            icon={domainIcons[d]}
          >
            {formatDomain(d)}
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OpusSidebar({
  manageableDomains,
}: {
  manageableDomains: DomainId[];
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col rounded-xl border bg-sidebar/40">
      <div className="px-3 py-3">
        <p className="font-serif text-xl text-primary leading-none">Opus</p>
        <p className="mt-1 text-xs text-muted-foreground">Plan &amp; execute</p>
      </div>
      <ScrollArea className="flex-1 px-2 pb-2">
        <nav className="space-y-1">
          <NavLink
            href="/dashboard/opus"
            active={pathname === "/dashboard/opus"}
            icon={LayoutDashboard}
          >
            Overview
          </NavLink>
          <DomainGroup
            title="Tasks"
            icon={ListChecks}
            base="/dashboard/opus/tasks"
            domains={DOMAIN_IDS}
            pathname={pathname}
            defaultOpen
          />
          {manageableDomains.length > 0 && (
            <DomainGroup
              title="Manage"
              icon={Settings2}
              base="/dashboard/opus/manage"
              domains={manageableDomains}
              pathname={pathname}
            />
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
