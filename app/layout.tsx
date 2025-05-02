import type { Metadata, Viewport } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import OrganizationStructuredData from "./components/StructuredData";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });

const siteConfig = {
  name: "Locaposty",
  description:
    "Locaposty is the best Google My Business (GMB) post scheduling tool with automated review replies and SEO performance tracking — built for local business growth.",
  url: "https://www.locaposty.com",
  ogImage: "https://www.locaposty.com/images/og-image.png",
};

export const viewport: Viewport = {
  themeColor: "#0A85C2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Locaposty | Best GMB Post Scheduler & Review Management Tool",
    template: "%s | Locaposty",
  },
  description: siteConfig.description,
  keywords: [
    "GMB post scheduler",
    "Google My Business automation",
    "auto review response",
    "GMB review tool",
    "local SEO software",
    "schedule GMB posts",
    "review management tool",
    "Locaposty",
    "Google Business Profile",
    "GBP management",
    "business listing",
    "scheduling tools",
    "automated posts",
    "location management",
    "review management",
    "multi-location business",
  ],
  authors: [{ name: "Locaposty Team" }],
  creator: "Locaposty Team",
  publisher: "Locaposty",
  robots: "index, follow",
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "Locaposty | GMB Scheduler, Review Responder & SEO Tracker",
    description:
      "Schedule Google My Business posts, automate review replies, and track local SEO performance with Locaposty — the all-in-one local business tool.",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Locaposty - Google My Business management platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Locaposty | GMB Post Scheduler & Review Automation Tool",
    description:
      "Automate Google Business posts, reply to reviews, and track performance — Locaposty helps grow your local SEO effortlessly.",
    images: [siteConfig.ogImage],
    creator: "@locaposty",
  },
  icons: {
    icon: [{ url: "/favicon/favicon.ico", sizes: "any" }],
    shortcut: "/favicon/favicon-16x16.png",
    apple: [{ url: "/favicon/favicon.ico" }],
    other: [{ url: "/favicon/favicon.ico", type: "image/x-icon" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <OrganizationStructuredData />
      </head>
      <body className={`${inter.variable} ${openSans.variable}`}>
        <Providers>
          {children}
          <div
            id="toast-container"
            className="fixed top-0 left-0 p-4 z-50 text-locaposty-text-dark"
          >
            {/* Toast notifications will be rendered here */}
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
