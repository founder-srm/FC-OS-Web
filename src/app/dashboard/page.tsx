import { BadgeCheck, BellIcon, CheckCircle2Icon, InfoIcon, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage() {
  return (
    <section className="flex flex-1 flex-col gap-6 items-start m-4 md:m-30">
      <div className="font-serif text-7xl">
        <h1 className="">Welcome</h1>
        <div className="flex flex-col items-start gap-2">
          <p className="text-primary">Om Pratap Dhaker</p>
          <div className="flex items-center gap-2 font-sans">
            <Badge className="">
              <Monitor data-icon="inline-start" />
              Technical
            </Badge>
            <Badge className="" variant={"secondary"}>
              Associate Lead
              <BadgeCheck data-icon="inline-end" />
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-6">
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
      </div>
    </section>
  );
}
