import { getApprovedMembers } from "@/utils/dbActions";
import MemberDirectoryClient from "./member-directory-client";

export const dynamic = "force-dynamic";

export default async function MemberDirectoryPage() {
  const members = await getApprovedMembers();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-primary">Member Directory</h1>
        <p className="text-sm text-muted-foreground">
          Browse and contact club members.{" "}
          <span className="font-medium text-foreground">
            {members.length} members
          </span>
        </p>
      </div>
      <MemberDirectoryClient members={members} />
    </div>
  );
}
