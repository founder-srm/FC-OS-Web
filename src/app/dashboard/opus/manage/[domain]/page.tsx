import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/context";
import { isDomainId } from "@/lib/opus/format";
import { canManageDomain } from "@/lib/opus/permissions";
import { getOpusDomainMeta } from "@/utils/opusDbActions";
import { ManageClient } from "../../_components/manage-client";

export const dynamic = "force-dynamic";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  if (!isDomainId(domain)) notFound();

  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!canManageDomain(ctx, domain))
    redirect(`/dashboard/opus/tasks/${domain}`);

  const meta = await getOpusDomainMeta(domain);

  return (
    <ManageClient
      domain={domain}
      statuses={meta.statuses}
      priorities={meta.priorities}
      labels={meta.labels}
    />
  );
}
