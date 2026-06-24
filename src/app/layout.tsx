import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "FC OS",
  description: "The Founders Operating System",
  openGraph: {
    title: "FC OS",
    description: "The Founders Operating System",
    url: siteUrl,
    siteName: "FC OS",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "FC OS",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FC OS",
    description: "The Founders Operating System",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "h-full",
        "antialiased",
        serif.variable,
        geist.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
