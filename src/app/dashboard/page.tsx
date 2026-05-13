import { Badge } from "@/components/ui/badge";
import { overviewItems } from "@/lib/dashboard-nav";
import { BadgeCheck, Monitor } from "lucide-react";

export default function DashboardPage() {
  const dashboardItem = overviewItems[0];

  return (
    <section className="flex flex-1 flex-col gap-6 items-start m-4 md:m-30">
      <div className="font-serif text-7xl">
        <h1 className="">Welcome</h1>
        <div className="flex flex-col items-start gap-2">
          <p className="text-primary">Om Pratap Dhaker</p>
          <div className="flex items-center gap-2">
            <Badge className="text-sm">
              <Monitor data-icon="inline-start" />
              Technical
            </Badge>
            <Badge className="text-sm" variant={"secondary"}>
              Associate Lead
              <BadgeCheck data-icon="inline-end" />
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
