import { redirect } from "next/navigation";

import { getAccessContext } from "@/lib/auth/context";
import { getAppSettings, getPendingMembers } from "@/utils/dbActions";
import MemberRequestRow from "./member-request-row";

export const dynamic = "force-dynamic";

export default async function MemberRequestsPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/dashboard");

  const { domainLeadsCanApprove } = await getAppSettings();
  const isDomainLeadApprover = ctx.isDomainLead && domainLeadsCanApprove;
  // The dashboard layout already gated auth/approval; this guards the
  // approver-only capability (HRM/leadership, or enabled domain leads).
  if (!ctx.isApprover && !isDomainLeadApprover) redirect("/dashboard");

  const allPending = await getPendingMembers();
  // Domain leads only see applicants requesting one of their own domains.
  const members = ctx.isApprover
    ? allPending
    : allPending.filter((m) =>
        m.domains.some((d) => ctx.domainIds.includes(d)),
      );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-primary">Member Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review and decide on pending membership applications.
        </p>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending requests right now.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((member) => (
            <MemberRequestRow key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
