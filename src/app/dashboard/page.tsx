import { BadgeCheck, BellIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getAccessContext } from "@/lib/auth/context";
import { type DomainId, domainIcons } from "@/lib/opus/format";
import { cn, leadershipRoles } from "@/lib/utils";
import { getProfile } from "@/utils/dbActions";

export default async function DashboardPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/dashboard");

  const profile = await getProfile(ctx.userId);
  if (!profile) redirect("/dashboard");

  const { firstName, lastName, domains, roles } = profile;

  return (
    <section className="flex flex-1 flex-col gap-6 items-start my-4 md:my-30">
      <div className="w-full space-y-6">
        <h1 className="font-serif text-7xl leading-none">
          Welcome,
          <p className="text-primary">
            {firstName} {lastName}
          </p>
        </h1>
        <div className="">
          <div className="flex flex-wrap items-center gap-2 font-sans">
            {domains.map((domain) => {
              const Icon = domainIcons[domain as DomainId];
              return (
                <Badge key={domain} className="capitalize">
                  <Icon data-icon="inline-center" strokeWidth={2.5} />
                  {domain}
                </Badge>
              );
            })}
            {roles.map((role) => (
              <Badge
                key={role}
                className={cn("capitalize")}
                variant={
                  leadershipRoles.has(role)
                    ? "leadershipDashBadge"
                    : "secondary"
                }
              >
                <BadgeCheck data-icon="inline-center" strokeWidth={2.5} />
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {/* <div className="flex flex-col gap-2 mt-6">
        <div className="flex items-center gap-2">
          <BellIcon size={14} />
          Notifications
        </div>
        <div className="grid w-full max-w-md items-start gap-2">
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Payment successful</AlertTitle>
            <AlertDescription>
              Your payment of $29.99 has been processed. A receipt has been sent
              to your email address.
            </AlertDescription>
          </Alert>
          <Alert>
            <InfoIcon />
            <AlertTitle>New feature available</AlertTitle>
            <AlertDescription>
              We&apos;ve added dark mode support. You can enable it in your
              account settings.
            </AlertDescription>
          </Alert>
        </div>
      </div> */}
    </section>
  );
}
