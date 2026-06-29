import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export default async function OpusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>;
}
