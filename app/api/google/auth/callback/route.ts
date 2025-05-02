import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  // Get the auth code and state from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This contains the user ID
  const error = searchParams.get("error");

  if (error) {
    console.error("Google auth error:", error);
    return NextResponse.redirect(
      new URL("/settings/locations/connect?error=auth_failed", request.url)
    );
  }

  if (!code || !state) {
    console.error("Missing code or state parameter");
    return NextResponse.redirect(
      new URL("/settings/locations/connect?error=missing_params", request.url)
    );
  }

  try {
    // Create an OAuth client using GMB-specific credentials
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID_GMB,
      process.env.GOOGLE_CLIENT_SECRET_GMB,
      `${process.env.NEXTAUTH_URL}/api/google/auth/callback`
    );

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !refresh_token) {
      throw new Error("Failed to obtain access tokens");
    }

    // Get the user ID from the state parameter
    const userId = state;

    // Store the tokens in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: refresh_token,
        googleAccessToken: access_token,
        googleTokenExpiresAt: expiry_date ? new Date(expiry_date) : undefined,
      },
    });

    // Redirect back to the connection page with a success parameter
    return NextResponse.redirect(
      new URL("/settings/locations/connect?success=true", request.url)
    );
  } catch (error) {
    console.error("Error handling Google callback:", error);
    return NextResponse.redirect(
      new URL("/settings/locations/connect?error=token_exchange", request.url)
    );
  }
}
