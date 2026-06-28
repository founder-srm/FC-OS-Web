import { AlarmClock, CalendarClock, CircleAlert, ListTodo } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAccessContext } from "@/lib/auth/context";
import {
  type DomainId,
  domainIcons,
  formatDomain,
  formatDueDate,
  isOverdue,
} from "@/lib/opus/format";
import { cn } from "@/lib/utils";
import { getOpusOverview } from "@/utils/opusDbActions";

export const dynamic = "force-dynamic";

const STAT_CARDS = [
  { key: "total", label: "Assigned to me", icon: ListTodo },
  { key: "dueSoon", label: "Due this week", icon: CalendarClock },
  { key: "overdue", label: "Overdue", icon: CircleAlert },
] as const;

export default async function OpusOverviewPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  const overview = await getOpusOverview(ctx.userId);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <h1 className="font-serif text-7xl text-primary">Overview</h1>

      <div className="grid gap-6 sm:grid-cols-3">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => {
          const value =
            key === "total"
              ? overview.openTotal
              : key === "overdue"
                ? overview.overdue
                : overview.dueSoon;
          return (
            <div
              className={cn(
                "bg-card rounded-xl p-6 space-y-6 shadow-md",
                key === "overdue" &&
                  value > 0 &&
                  "bg-destructive text-primary-foreground",
              )}
              key={key}
            >
              <div
                className={cn(
                  "flex justify-between items-center text-muted-foreground text-base font-medium",
                  key === "overdue" && value > 0 && "text-primary-foreground",
                )}
              >
                <p>{label}</p>
                <Icon className={cn("size-4")} strokeWidth={2.5} />
              </div>
              <div className="text-5xl font-bold font-serif">
                <p>{value}</p>
              </div>
            </div>

            // <Card key={key}>
            //   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            //     <CardDescription>{label}</CardDescription>
            //     <Icon
            //       className={
            //         key === "overdue"
            //           ? "size-4 text-destructive"
            //           : "size-4 text-muted-foreground"
            //       }
            //     />
            //   </CardHeader>
            //   <CardContent>
            //     <p className="font-serif text-4xl">{value}</p>
            //   </CardContent>
            // </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By status</CardTitle>
            <CardDescription>How your tasks are distributed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              overview.byStatus.map((s) => {
                const pct = Math.round((s.count / overview.total) * 100);
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By domain</CardTitle>
            <CardDescription>Where your work lives.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {overview.byDomain.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              overview.byDomain.map((d) => {
                const Icon = domainIcons[d.domain as DomainId];
                return (
                  <Link
                    key={d.domain}
                    href={`/dashboard/opus/tasks/${d.domain}`}
                  >
                    <Badge variant="secondary" className="gap-1.5">
                      <Icon className="size-3.5" />
                      {formatDomain(d.domain)}
                      <span className="text-muted-foreground">{d.count}</span>
                    </Badge>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently updated</CardTitle>
          <CardDescription>Your latest assigned tasks.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {overview.recent.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Nothing assigned to you yet.
            </p>
          ) : (
            overview.recent.map((t) => {
              const overdue = isOverdue(t.dueDate, t.statusName);
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/opus/tasks/${t.domain}?task=${t.parentTaskId ?? t.id}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDomain(t.domain)} · {t.statusName}
                    </p>
                  </div>
                  {t.dueDate && (
                    <div className="flex shrink-0 items-center gap-1.5 text-xs">
                      {overdue && (
                        <AlarmClock className="size-3.5 text-destructive" />
                      )}
                      <span
                        className={
                          overdue ? "text-destructive" : "text-muted-foreground"
                        }
                      >
                        {formatDueDate(t.dueDate)}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
