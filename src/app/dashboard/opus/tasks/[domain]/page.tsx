import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/context";
import { isDomainId } from "@/lib/opus/format";
import { canManageDomain } from "@/lib/opus/permissions";
import { getDomainMembers, getOpusBoard } from "@/utils/opusDbActions";
import { KanbanBoard } from "../../_components/kanban-board";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  if (!isDomainId(domain)) notFound();

  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  const [board, members] = await Promise.all([
    getOpusBoard(domain),
    getDomainMembers(domain),
  ]);

  return (
    <KanbanBoard
      domain={domain}
      meta={{
        statuses: board.statuses,
        priorities: board.priorities,
        labels: board.labels,
        members,
      }}
      tasks={board.tasks}
      canManage={canManageDomain(ctx, domain)}
      currentUserId={ctx.userId}
    />
  );
}
