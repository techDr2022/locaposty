import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Add paths that require an active subscription
const PROTECTED_PATHS = [
  "/dashboard",
  "/locations",
  "/posts",
  "/reviews",
  "/analytics",
  "/upgrade",
  "/reports",
  "/settings",
];

// Paths that are excluded from subscription checks
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/pricing",
  "/api",
  "/_next",
  "/images",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if path requires subscription
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Only apply subscription checks to protected paths
  if (isProtectedPath) {
    // Get session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token, redirect to login
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // If trial has expired
    if (
      token.subscriptionStatus === "PAST_DUE" ||
      token.subscriptionStatus === "EXPIRED"
    ) {
      // Don't redirect if already on the upgrade page
      if (pathname === "/upgrade") {
        return NextResponse.next();
      }

      // Redirect to upgrade page with callback URL
      const url = new URL("/upgrade", request.url);
      url.searchParams.set("callbackUrl", pathname);
      console.log("Redirecting to upgrade page", url);
      return NextResponse.redirect(url);
    }

    // If on trial, check if it has expired (extra protection)
    if (token.subscriptionStatus === "TRIALING" && token.trialEndsAt) {
      const trialEndsAt = new Date(token.trialEndsAt);
      const now = new Date();

      if (now > trialEndsAt) {
        // Don't redirect if already on the upgrade page
        if (pathname === "/upgrade") {
          return NextResponse.next();
        }

        // Redirect to upgrade page with callback URL
        const url = new URL("/upgrade", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
