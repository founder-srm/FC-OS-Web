import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundGlitch } from "@/components/not-found-glitch";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 • FC OS",
};

export default function NotFound() {
  return (
    <div className="not-found-in flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <NotFoundGlitch />

      <div className="space-y-2">
        <p className="font-serif text-7xl text-foreground">Are You Lost?</p>
        <p className="text-base font-semibold text-muted-foreground">
          Let us help you out of here!
        </p>
      </div>

      <Button asChild size="lg" variant="outline" className="mt-2">
        <Link href="/dashboard" className="font-semobold capitalize">
          <LayoutDashboard />
          dashboard
        </Link>
      </Button>
    </div>
  );
}
