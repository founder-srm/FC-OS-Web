import { LayoutDashboard, ListChecks, Settings2 } from "lucide-react";

import type { DashboardNavItem } from "@/lib/dashboard-nav";
import {
  DOMAIN_IDS,
  type DomainId,
  domainIcons,
  formatDomain,
} from "@/lib/opus/format";

// Build a collapsible group of per-domain links under a shared base path.
function domainGroup(
  id: string,
  label: string,
  icon: DashboardNavItem["icon"],
  base: string,
  domains: readonly DomainId[],
  defaultOpen = false,
): DashboardNavItem {
  return {
    id,
    label,
    icon,
    href: base,
    description: label,
    defaultOpen,
    children: domains.map((d) => ({
      id: `${id}-${d}`,
      label: formatDomain(d),
      icon: domainIcons[d],
      href: `${base}/${d}`,
      description: formatDomain(d),
    })),
  };
}

// Opus sub-navigation. `manage` is per-user (server-computed via
// `manageableDomains`), so this can't live in the static sidebar config —
// it is injected at render time through `AppSidebar`'s `navChildren` seam.
export function buildOpusNavChildren(manage: DomainId[]): DashboardNavItem[] {
  const children: DashboardNavItem[] = [
    {
      id: "opus-overview",
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/opus",
      description: "Planning and execution workspace",
    },
    domainGroup(
      "opus-tasks",
      "Tasks",
      ListChecks,
      "/dashboard/opus/tasks",
      DOMAIN_IDS,
      true,
    ),
  ];

  if (manage.length > 0) {
    children.push(
      domainGroup(
        "opus-manage",
        "Manage",
        Settings2,
        "/dashboard/opus/manage",
        manage,
      ),
    );
  }

  return children;
}
