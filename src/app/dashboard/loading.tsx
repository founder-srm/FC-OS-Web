import { BrandedLoader } from "@/components/branded-loader";

// Single global fallback for all /dashboard/* routes. Next bubbles this
// Suspense boundary down to any descendant page that lacks its own loading.tsx,
// so this one file covers every tool while the sidebar + header persist.
export default function DashboardLoading() {
  return <BrandedLoader />;
}
