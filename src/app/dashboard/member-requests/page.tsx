import { redirect } from "next/navigation";

import { getAccessContext } from "@/lib/auth/context";
import { getPendingMembers } from "@/utils/dbActions";
import MemberRequestRow from "./member-request-row";

export const dynamic = "force-dynamic";

export default async function MemberRequestsPage() {
  const ctx = await getAccessContext();
  // The dashboard layout already gated auth/approval; this guards the
  // approver-only capability.
  if (!ctx?.isApprover) redirect("/dashboard");

  const members = await getPendingMembers();

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
