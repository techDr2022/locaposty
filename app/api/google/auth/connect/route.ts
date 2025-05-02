import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OAuth2Client } from "google-auth-library";

// Google OAuth2 scopes for GBP API access
const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export async function GET() {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Create an OAuth client with a dedicated callback URL for GMB
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID_GMB,
      process.env.GOOGLE_CLIENT_SECRET_GMB,
      // Use a dedicated callback URL for GMB connections
      `${process.env.NEXTAUTH_URL}/api/google/auth/callback`
    );

    // Generate the auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      // Include the user ID in the state parameter
      state: session.user.id,
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error connecting to Google:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google connection" },
      { status: 500 }
    );
  }
}
