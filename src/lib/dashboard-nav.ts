import {
  AudioLines,
  BookUser,
  CircleUserRound,
  LayoutDashboard,
  type LucideIcon,
  MonitorUp,
  PersonStanding,
  Target,
  UserCheck,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  href: string;
  badge?: string;
  disabled?: boolean;
  // When true, only HRM / leadership (approvers) see this item.
  requiresApprover?: boolean;
};

export type DashboardNavSection = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

export type DashboardSidebarConfig = {
  sections: DashboardNavSection[];
  footerItems: DashboardNavItem[];
};

const DASHBOARD_ROOT = "/dashboard";

export const dashboardSidebarConfig = {
  sections: [
    {
      id: "overview",
      label: "Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: DASHBOARD_ROOT,
          description: "Workspace overview",
        },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      items: [
        {
          id: "mom",
          label: "MoM",
          icon: AudioLines,
          href: "/dashboard/MoM",
          description: "Meeting notes and follow-ups",
          // badge: "Notes",
        },
        {
          id: "attendance-tracker",
          label: "Attendance Tracker",
          icon: PersonStanding,
          href: "/dashboard/attendance-tracker",
          description: "Attendance and participation tracking",
          // badge: "Live",
        },
        {
          id: "fc-tv-cms",
          label: "FC TV CMS",
          icon: MonitorUp,
          href: "/dashboard/FC-TV-CMS",
          description: "Content publishing and media control",
          badge: "Soon",
          disabled: true,
        },
        {
          id: "performance-tracker",
          label: "Performance Tracker",
          icon: Users,
          href: "/dashboard/performance-tracker",
          description: "Team performance overview",
          // badge: "Ops",
          // disabled: true,
        },
        {
          id: "opus",
          label: "Opus",
          icon: Target,
          href: "/dashboard/opus",
          description: "Planning and execution workspace",
          // badge: "Exec",
          // disabled: true,
        },
      ],
    },
    {
      id: "administration",
      label: "Administration",
      items: [
        {
          id: "member-requests",
          label: "Member Requests",
          icon: UserCheck,
          href: "/dashboard/member-requests",
          description: "Approve or reject pending members",
          requiresApprover: true,
        },
      ],
    },
    {
      id: "coming-soon",
      label: "Coming Soon",
      items: [
        {
          id: "member-directory",
          label: "Member Directory",
          icon: BookUser,
          href: "/dashboard/member-directory",
          badge: "Soon",
          description: "More to come soon",
        },
      ],
    },
  ],
  footerItems: [
    {
      id: "profile",
      label: "Profile",
      icon: CircleUserRound,
      href: "/dashboard/profile",
      description: "Account settings",
    },
  ],
} satisfies DashboardSidebarConfig;

export const allDashboardNavItems: DashboardNavItem[] = [
  ...dashboardSidebarConfig.sections.flatMap<DashboardNavItem>(
    (section) => section.items,
  ),
  ...dashboardSidebarConfig.footerItems,
];

const defaultDashboardNavItem = allDashboardNavItems[0];

if (!defaultDashboardNavItem) {
  throw new Error("dashboardSidebarConfig must include at least one nav item.");
}

export const getDashboardNavItemById = (id: string) =>
  allDashboardNavItems.find((item) => item.id === id);

export const getDashboardNavItemByPathname = (pathname: string) =>
  allDashboardNavItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== DASHBOARD_ROOT && pathname.startsWith(`${item.href}/`)),
  ) ?? defaultDashboardNavItem;
