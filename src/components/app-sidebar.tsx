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
  getDashboardNavItemByPathname,
  overviewItems,
  profileItem,
  toolItems,
  upcomingItems,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  item: DashboardNavItem;
  isActive: boolean;
  badge?: string;
};

function SidebarNavItem({ item, isActive, badge }: SidebarNavItemProps) {
  const buttonClassName = cn("h-10 px-2.5", badge && "pr-14");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.label}
        isActive={isActive}
        className={buttonClassName}
      >
        <Link href={item.href}>
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
      {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const activeItem = getDashboardNavItemByPathname(pathname);

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
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={activeItem.id === item.id}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item, index) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={activeItem.id === item.id}
                  badge={String(index + 1).padStart(2, "0")}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Coming Soon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {upcomingItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={activeItem.id === item.id}
                  badge={item.badge}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-2">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {activeItem.label}
          </p>
          <p className="text-xs text-sidebar-foreground/70">
            {activeItem.description}
          </p>
        </div>
        <SidebarMenu>
          <SidebarNavItem
            item={profileItem}
            isActive={activeItem.id === profileItem.id}
          />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
