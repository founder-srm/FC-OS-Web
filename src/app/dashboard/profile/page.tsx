import { Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import CopyButton from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { getAccessContext } from "@/lib/auth/context";
import { getAppSettings, getProfile } from "@/utils/dbActions";
import SettingsDialog from "./settings-dialog";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/dashboard");

  const profile = await getProfile(ctx.userId);
  if (!profile) redirect("/dashboard");

  const { domainLeadsCanApprove } = await getAppSettings();
  const initials =
    `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-6 mt-6 m-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-7xl text-primary">Your Profile</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {ctx.isApprover ? (
            <SettingsDialog domainLeadsCanApprove={domainLeadsCanApprove} />
          ) : null}
          <Button variant={"outline"}>
            <Wrench />
            <span className="hidden sm:inline">Manage</span>
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {/* Section for name and initials */}
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center text-5xl rounded-full bg-primary text-primary-foreground size-24 font-serif">
            {initials}
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-3xl font-semibold tracking-tight">
              {profile.firstName} {profile.lastName}
            </p>
            <span className="font-medium text-muted-foreground flex items-center gap-4">
              {profile.email}
              <CopyButton value={profile.email} />
            </span>
          </div>
        </div>

        {/* Render Other Details */}
        <div className="p-8 w-full space-y-8 sm:grid sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-1 sm:col-span-1">
            <p className="text-lg font-medium text-muted-foreground">Phone</p>
            <span className="text-xl font-semibold">{profile.phone}</span>
          </div>
          <div className="space-y-1 sm:col-span-1">
            <p className="text-lg font-medium text-muted-foreground">
              {profile.domains.length > 1 ? "Domains" : "Domain"}
            </p>
            <ul className="space-y-0.5">
              {profile.domains.length > 0 ? (
                profile.domains.map((domain) => (
                  <li key={domain} className="text-xl font-semibold capitalize">
                    {domain}
                  </li>
                ))
              ) : (
                <span className="text-xl font-semibold">None</span>
              )}
            </ul>
            {/* <span className="text-xl font-semibold">{profile.phone}</span> */}
          </div>
          <div className="space-y-1 sm:col-span-1">
            <p className="text-lg font-medium text-muted-foreground">
              {profile.roles.length > 1 ? "Roles" : "Role"}
            </p>
            <ul className="space-y-0.5">
              {profile.roles.length > 0 ? (
                profile.roles.map((role) => (
                  <li key={role} className="text-xl font-semibold capitalize">
                    {role}
                  </li>
                ))
              ) : (
                <span className="text-xl font-semibold">None</span>
              )}
            </ul>
            {/* <span className="text-xl font-semibold">{profile.phone}</span> */}
          </div>
        </div>
      </div>
    </div>
  );
}
