"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  type DashboardNavItem,
  dashboardSidebarConfig,
  getDashboardNavItemByPathname,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { Avatar, AvatarBadge, AvatarFallback } from "./ui/avatar";

type SidebarNavItemProps = {
  item: DashboardNavItem;
  isActive: boolean;
};

function SidebarNavItem({ item, isActive }: SidebarNavItemProps) {
  const buttonClassName = cn("h-10 px-2.5", item.badge && "pr-20");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.label}
        isActive={isActive}
        className={buttonClassName}
      >
        <Link
          href={item.href}
          aria-disabled={item.disabled || undefined}
          prefetch={item.disabled ? false : undefined}
          tabIndex={item.disabled ? -1 : undefined}
          onClick={
            item.disabled
              ? (event) => {
                  event.preventDefault();
                }
              : undefined
          }
        >
          <item.icon
            className={
              item.id === "profile"
                ? "text-sidebar-foreground"
                : "text-sidebar-primary"
            }
          />
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
  ...props
}: ComponentProps<typeof Sidebar> & {
  isApprover?: boolean;
  // Enabled domain leads can also reach Member Requests.
  canApproveMembers?: boolean;
  userName?: string;
}) {
  const pathname = usePathname();
  const activeItem = getDashboardNavItemByPathname(pathname);
  const displayName = userName.trim() || "Member";
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
                      item={item}
                      isActive={activeItem.id === item.id}
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
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarRail />
    </Sidebar>
  );
}
