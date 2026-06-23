import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthState } from "@/lib/auth/context";
import { getAppSettings } from "@/utils/dbActions";

export const metadata: Metadata = {
  title: "FC OS • Dashboard",
  description: "The Founders Operating System",
};

// Reads the session, so this subtree must render dynamically.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `proxy.ts` already blocks anonymous requests; this enforces the
  // onboarding/approval state machine and derives approver visibility.
  const state = await getAuthState();
  if (state.kind === "unauthenticated") redirect("/login");
  if (state.kind === "no-profile") redirect("/onboarding");
  if (state.ctx.status !== "approved") redirect("/pending");

  const { domainLeadsCanApprove } = await getAppSettings();
  const canApproveMembers =
    state.ctx.isApprover || (state.ctx.isDomainLead && domainLeadsCanApprove);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          collapsible={"icon"}
          isApprover={state.ctx.isApprover}
          canApproveMembers={canApproveMembers}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 rounded-full" />
              <Separator orientation="vertical" className="" />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
