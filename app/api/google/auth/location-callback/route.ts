import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Get the auth code and state from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This contains the user ID and location ID
  const error = searchParams.get("error");

  if (error) {
    console.error("Google auth error:", error);
    return NextResponse.redirect(
      new URL("/settings/locations?error=auth_failed", request.url)
    );
  }

  if (!code || !state) {
    console.error("Missing code or state parameter");
    return NextResponse.redirect(
      new URL("/settings/locations?error=missing_params", request.url)
    );
  }

  try {
    // Parse the state parameter to get user ID and location ID
    const [userId, locationId] = state.split(":");

    if (!userId || !locationId) {
      throw new Error("Invalid state parameter");
    }

    // Create an OAuth client using GMB-specific credentials
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID_GMB,
      process.env.GOOGLE_CLIENT_SECRET_GMB,
      `${process.env.NEXTAUTH_URL}/api/google/auth/location-callback`
    );

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !refresh_token) {
      throw new Error("Failed to obtain access tokens");
    }

    // Update the location with new tokens
    await prisma.location.update({
      where: { id: locationId },
      data: {
        refreshToken: refresh_token,
        accessToken: access_token,
        tokenExpiresAt: expiry_date ? new Date(expiry_date) : undefined,
      },
    });

    // Redirect back with success parameter
    return NextResponse.redirect(
      new URL(
        `/settings/locations?success=reconnected&locationId=${locationId}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error handling Google location callback:", error);
    return NextResponse.redirect(
      new URL("/settings/locations?error=token_exchange", request.url)
    );
  }
}
