import { redirect } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-primary">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your account details and roles.
          </p>
        </div>
        {ctx.isApprover ? (
          <SettingsDialog domainLeadsCanApprove={domainLeadsCanApprove} />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {profile.firstName} {profile.lastName}
              </CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Phone</p>
            <p className="text-sm text-muted-foreground">{profile.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Roles</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {profile.roles.length > 0 ? (
                profile.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Domains</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {profile.domains.length > 0 ? (
                profile.domains.map((domain) => (
                  <Badge key={domain} variant="outline">
                    {domain}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
