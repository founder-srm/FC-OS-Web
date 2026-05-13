import { notFound } from "next/navigation";

import {
  dashboardSectionIds,
  getDashboardNavItemById,
} from "@/lib/dashboard-nav";

export function generateStaticParams() {
  return dashboardSectionIds.map((section) => ({ section }));
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const item = getDashboardNavItemById(section);

  if (!item || item.id === "dashboard") {
    notFound();
  }

  return (
    <section className="flex flex-1 flex-col gap-6 rounded-2xl border border-border/60 bg-card/40 p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Founders Club OS
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{item.label}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {item.description}
        </p>
      </div>
    </section>
  );
}
