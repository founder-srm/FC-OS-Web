import Image from "next/image";
import { cn } from "@/lib/utils";

// Global, brand-consistent loading indicator: the FC logo held inside a
// spinning ring. Rendered by `dashboard/loading.tsx` as the Suspense fallback
// for every route under /dashboard, and reusable anywhere an inline loading
// state is needed. Fades in after a short delay (.loader-fade-in) so fast
// navigations never flash the spinner.
export function BrandedLoader({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "loader-fade-in flex min-h-[60vh] w-full flex-col items-center justify-center gap-4",
        className,
      )}
    >
      <div className="relative flex size-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <Image
          src="/FCLogo.svg"
          width={20}
          height={26}
          alt=""
          aria-hidden
          priority
        />
      </div>
      {label ? (
        <p className="font-serif text-xl text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
