"use client";

import { ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentProps, useState } from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import {
  type DashboardNavItem,
  dashboardSidebarConfig,
} from "@/lib/dashboard-nav";
import type { DomainId } from "@/lib/opus/format";
import { buildOpusNavChildren } from "@/lib/opus/nav";
import { cn } from "@/lib/utils";
import { Avatar, AvatarBadge, AvatarFallback } from "./ui/avatar";

// True when the current route matches the item or any of its descendants —
// used to decide whether a collapsible group starts expanded.
function isBranchActive(item: DashboardNavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (item.children?.some((child) => isBranchActive(child, pathname)))
    return true;
  return pathname.startsWith(`${item.href}/`);
}

function disabledLinkProps(item: DashboardNavItem) {
  return {
    "aria-disabled": item.disabled || undefined,
    prefetch: item.disabled ? false : undefined,
    tabIndex: item.disabled ? -1 : undefined,
    onClick: item.disabled
      ? (event: React.MouseEvent) => event.preventDefault()
      : undefined,
  };
}

// Nested (depth >= 1) nav node, rendered with the sub-menu primitives.
function SidebarNavSubItem({
  item,
  pathname,
}: {
  item: DashboardNavItem;
  pathname: string;
}) {
  if (!item.children?.length) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={pathname === item.href}>
          <Link href={item.href} {...disabledLinkProps(item)}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <Collapsible
      asChild
      className="group/collapsible"
      defaultOpen={item.defaultOpen || isBranchActive(item, pathname)}
    >
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton className="cursor-pointer">
            <item.icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarNavSubItem
                key={child.id}
                item={child}
                pathname={pathname}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  );
}

// Top-level nav node — a leaf link, or a toggle-only collapsible group
// (sidebar-07 pattern: the whole row toggles its dropdown).
function SidebarNavItem({
  item,
  pathname,
}: {
  item: DashboardNavItem;
  pathname: string;
}) {
  const buttonClassName = cn("h-10 px-2.5", item.badge && "pr-20");
  const iconClassName =
    item.id === "profile" ? "text-sidebar-foreground" : "text-sidebar-primary";

  // Leaf item — unchanged behavior.
  if (!item.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={item.label}
          isActive={pathname === item.href}
          className={buttonClassName}
        >
          <Link href={item.href} {...disabledLinkProps(item)}>
            <item.icon className={iconClassName} />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {item.badge ? (
          <SidebarMenuBadge className="max-w-20 truncate">
            {item.badge}
          </SidebarMenuBadge>
        ) : null}
      </SidebarMenuItem>
    );
  }

  // Group — sidebar-07 pattern: the whole row toggles the dropdown (no nav).
  // Navigation to the section's overview is handled by its first child link.
  const defaultOpen = item.defaultOpen || isBranchActive(item, pathname);

  return (
    <Collapsible
      asChild
      className="group/collapsible"
      defaultOpen={defaultOpen}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.label}
            className={cn(buttonClassName, "cursor-pointer")}
          >
            <item.icon className={iconClassName} />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarNavSubItem
                key={child.id}
                item={child}
                pathname={pathname}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FC";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "FC";
}

export function AppSidebar({
  isApprover = false,
  canApproveMembers = false,
  userName = "",
  navData,
  ...props
}: ComponentProps<typeof Sidebar> & {
  isApprover?: boolean;
  // Enabled domain leads can also reach Member Requests.
  canApproveMembers?: boolean;
  userName?: string;
  // Serializable inputs for dynamic sub-nav (icons are attached client-side
  // here, never passed across the RSC boundary).
  navData?: { manageableDomains?: DomainId[] };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const displayName = userName.trim() || "Member";

  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await authClient.signOut();
    if (error) {
      setLoggingOut(false);
      toast.error(error.message ?? "Could not log out.");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  // Per-product dynamic sub-nav, keyed by nav-item id. Built client-side so
  // Lucide icon components never cross the server→client boundary.
  const navChildren: Record<string, DashboardNavItem[]> = {
    opus: buildOpusNavChildren(navData?.manageableDomains ?? []),
  };
  const initials = getInitials(userName);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Founders Club">
              <Link href="/dashboard">
                <div className="flex size-10 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/40 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
                  <Image
                    src="/FCLogo.svg"
                    width={16}
                    height={20}
                    alt="Founders Club logo"
                  />
                </div>
                <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-2xl font-serif">
                    Founders Club
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-auto" />

      <SidebarContent>
        {dashboardSidebarConfig.sections.map((section) => {
          const items = section.items.filter(
            (item) =>
              !("requiresApprover" in item && item.requiresApprover) ||
              isApprover ||
              (item.id === "member-requests" && canApproveMembers),
          );
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.id}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={
                        navChildren?.[item.id]
                          ? { ...item, children: navChildren[item.id] }
                          : item
                      }
                      pathname={pathname}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarSeparator className="mx-auto" />

      <SidebarFooter className="">
        {/* <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {activeItem.label}
          </p>
          <p className="text-xs text-sidebar-foreground/70">
            {activeItem.description}
          </p>
        </div> */}
      </SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center justify-center">
          <SidebarMenuButton size={"lg"} asChild>
            <Link href={"/dashboard/profile"}>
              <Avatar size={"lg"}>
                <AvatarFallback className="rounded-lg font-serif leading-snug">
                  {initials}
                </AvatarFallback>
                <AvatarBadge className="bg-primary" />
              </Avatar>
              <h1 className="truncate font-serif text-2xl text-sidebar-foreground">
                {displayName}
              </h1>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuAction
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log out"
            aria-label="Log out"
            className="top-1/2 -translate-y-1/2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut />
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarRail />
    </Sidebar>
  );
}
