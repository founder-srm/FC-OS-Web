import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/context";
import { manageableDomains } from "@/lib/opus/permissions";

export const dynamic = "force-dynamic";

export default async function ManageIndexPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  const domains = manageableDomains(ctx);
  if (domains.length === 0) redirect("/dashboard/opus");
  redirect(`/dashboard/opus/manage/${domains[0]}`);
}
