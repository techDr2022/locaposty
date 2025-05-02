import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get the URL parameters
    const url = new URL(req.url);
    const planType = url.searchParams.get("plan");
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";

    // If no plan specified, just redirect
    if (!planType) {
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Create a trial subscription
    const response = await fetch(
      new URL("/api/subscriptions/create-trial", req.url).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      }
    );

    if (!response.ok) {
      // If trial creation fails, redirect with error
      const errorUrl = new URL(callbackUrl, req.url);
      errorUrl.searchParams.set("error", "Failed to start trial");
      return NextResponse.redirect(errorUrl);
    }

    // On success, redirect to the dashboard or original callback URL
    return NextResponse.redirect(new URL(callbackUrl, req.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=trial_setup_failed", req.url)
    );
  }
}
