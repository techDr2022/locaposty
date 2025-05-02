import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";

// Google OAuth2 scopes for GBP API access
const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the location ID from the request
    const body = await request.json();
    const { locationId } = body;

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

    // Create an OAuth client with a dedicated callback URL for GMB
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID_GMB,
      process.env.GOOGLE_CLIENT_SECRET_GMB,
      // Use a dedicated callback URL for location reconnection
      `${process.env.NEXTAUTH_URL}/api/google/auth/location-callback`
    );

    // Generate the auth URL with location ID in state
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      // Include both user ID and location ID in the state parameter
      state: `${session.user.id}:${locationId}`,
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error reconnecting location to Google:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google reconnection" },
      { status: 500 }
    );
  }
}
