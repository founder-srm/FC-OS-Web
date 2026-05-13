import {
  AudioLines,
  BookUser,
  CircleUserRound,
  LayoutDashboard,
  type LucideIcon,
  MonitorUp,
  PersonStanding,
  Target,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  href: string;
  badge?: string;
};

const DASHBOARD_ROOT = "/dashboard";

const createDashboardHref = (id: string) =>
  id === "dashboard" ? DASHBOARD_ROOT : `${DASHBOARD_ROOT}/${id}`;

export const overviewItems: DashboardNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: createDashboardHref("dashboard"),
    description: "Workspace overview",
  },
];

export const toolItems: DashboardNavItem[] = [
  {
    id: "mom",
    label: "MoM",
    icon: AudioLines,
    href: createDashboardHref("mom"),
    description: "Meeting notes and follow-ups",
  },
  {
    id: "attendance-tracker",
    label: "Attendance Tracker",
    icon: PersonStanding,
    href: createDashboardHref("attendance-tracker"),
    description: "Attendance and participation tracking",
  },
  {
    id: "fc-tv-cms",
    label: "FC TV CMS",
    icon: MonitorUp,
    href: createDashboardHref("fc-tv-cms"),
    description: "Content publishing and media control",
  },
  {
    id: "performance-tracker",
    label: "Performance Tracker",
    icon: Users,
    href: createDashboardHref("performance-tracker"),
    description: "Team performance overview",
  },
  {
    id: "pod",
    label: "Pod",
    icon: Target,
    href: createDashboardHref("pod"),
    description: "Planning and execution workspace",
  },
];

export const upcomingItems: DashboardNavItem[] = [
  {
    id: "member-directory",
    label: "Member Directory",
    icon: BookUser,
    href: createDashboardHref("member-directory"),
    badge: "Soon",
    description: "More to come soon",
  },
];

export const profileItem: DashboardNavItem = {
  id: "profile",
  label: "Profile",
  icon: CircleUserRound,
  href: createDashboardHref("profile"),
  description: "Account settings",
};

export const allDashboardNavItems: DashboardNavItem[] = [
  ...overviewItems,
  ...toolItems,
  ...upcomingItems,
  profileItem,
];

export const dashboardSectionIds = allDashboardNavItems
  .filter((item) => item.id !== "dashboard")
  .map((item) => item.id);

export const getDashboardNavItemById = (id: string) =>
  allDashboardNavItems.find((item) => item.id === id);

export const getDashboardNavItemByPathname = (pathname: string) =>
  allDashboardNavItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== DASHBOARD_ROOT && pathname.startsWith(`${item.href}/`)),
  ) ?? overviewItems[0];
