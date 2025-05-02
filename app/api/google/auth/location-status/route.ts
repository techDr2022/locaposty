import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the location ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Verify the user has access to this location
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found or access denied" },
        { status: 404 }
      );
    }

    // Check if the location has tokens
    const hasTokens = !!(location.refreshToken && location.accessToken);

    if (!hasTokens) {
      return NextResponse.json({
        status: "disconnected",
        message: "Location is not connected to Google",
      });
    }

    // If token is expired or about to expire, check if it can be refreshed
    if (!location.tokenExpiresAt || new Date() > location.tokenExpiresAt) {
      try {
        // Create OAuth client
        const oauth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID_GMB,
          process.env.GOOGLE_CLIENT_SECRET_GMB,
          `${process.env.NEXTAUTH_URL}/api/google/auth/location-callback`
        );

        // Set credentials
        oauth2Client.setCredentials({
          refresh_token: location.refreshToken,
        });

        // Try to refresh the token
        await oauth2Client.refreshAccessToken();

        // Token was refreshed successfully
        return NextResponse.json({
          status: "connected",
          message: "Location is connected to Google",
        });
      } catch (error) {
        console.error("Token refresh failed:", error);

        // Mark tokens as invalid
        await prisma.location.update({
          where: { id: locationId },
          data: {
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
          },
        });

        return NextResponse.json({
          status: "invalid",
          message:
            "Authentication has expired. Location needs to be reconnected.",
        });
      }
    }

    // Token is valid
    return NextResponse.json({
      status: "connected",
      message: "Location is connected to Google",
    });
  } catch (error) {
    console.error("Error checking location status:", error);
    return NextResponse.json(
      { error: "Failed to check location status" },
      { status: 500 }
    );
  }
}
