import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/context";
import { manageableDomains } from "@/lib/opus/permissions";
import { OpusSidebar } from "./_components/opus-sidebar";

export const dynamic = "force-dynamic";

export default async function OpusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  const manage = manageableDomains(ctx);

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <OpusSidebar manageableDomains={manage} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
