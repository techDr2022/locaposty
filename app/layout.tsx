import type { Metadata, Viewport } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import OrganizationStructuredData from "./components/StructuredData";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });

const siteConfig = {
  name: "LocaPosty",
  description:
    "Automate and optimize your Google Business Profile management. Schedule posts, respond to reviews, and manage multiple locations effortlessly.",
  url: "https://locaposty.com",
  ogImage: "https://locaposty.com/og-image.jpg",
};

export const viewport: Viewport = {
  themeColor: "#0A85C2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "LocaPosty - Google Business Profile Manager",
    template: "%s | LocaPosty",
  },
  description: siteConfig.description,
  keywords: [
    "Google Business Profile",
    "GBP management",
    "business listing",
    "scheduling tools",
    "automated posts",
    "GBP scheduling",
    "GBP automation",
    "GBP management tools",
    "GBP management software",
    "GBP management platform",
    "GBP management solution",
    "GBP management software",
    "local SEO",
    "automated posts",
    "location management",
    "review management",
    "multi-location business",
  ],
  authors: [{ name: "LocaPosty Team" }],
  creator: "LocaPosty",
  publisher: "LocaPosty",
  robots: "index, follow",
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "LocaPosty - Google Business Profile Manager",
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "LocaPosty - Automate your Google Business Profile management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LocaPosty - Google Business Profile Manager",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@locaposty",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
