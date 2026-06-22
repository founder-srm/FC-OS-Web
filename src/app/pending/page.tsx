import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthState } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const state = await getAuthState();

  if (state.kind === "unauthenticated") redirect("/login");
  if (state.kind === "no-profile") redirect("/onboarding");
  if (state.ctx.status === "approved") redirect("/dashboard");

  const rejected = state.ctx.status === "rejected";

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-3xl text-primary">
            {rejected ? "Application not approved" : "Application pending"}
          </CardTitle>
          <CardDescription className="font-sans">
            {rejected
              ? "Your membership request was not approved. Please reach out to the HR team if you believe this is a mistake."
              : "Your application is pending approval from the HR team. You'll be able to access the dashboard once it's approved."}
          </CardDescription>
        </CardHeader>
        <CardContent className="font-sans text-sm text-muted-foreground">
          You can safely close this page and check back later.
        </CardContent>
      </Card>
    </main>
  );
}
