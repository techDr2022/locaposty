import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/db";

export async function GET() {
  try {
    console.log("Fetching GMB accounts...");

    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("User authenticated, fetching Google tokens");

    // Find the user to get their Google tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        // Google tokens that need to be added to the User model
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
      },
    });

    console.log("User tokens status:", {
      hasAccessToken: !!user?.googleAccessToken,
      hasRefreshToken: !!user?.googleRefreshToken,
    });

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 400 }
      );
    }

    // Set up the OAuth client using GMB-specific credentials
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID_GMB,
      process.env.GOOGLE_CLIENT_SECRET_GMB,
      `${process.env.NEXTAUTH_URL}/api/google/auth/callback`
    );

    // Set the credentials
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiresAt?.getTime() || undefined,
    });

    // Check if token is expired and refresh if needed
    if (
      user.googleTokenExpiresAt &&
      user.googleTokenExpiresAt.getTime() < Date.now()
    ) {
      console.log("Token is expired, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log("Token refreshed successfully");

      // Update the tokens in the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: credentials.access_token,
          googleTokenExpiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : undefined,
        },
      });
    }

    // Get the access token
    const accessToken = (await oauth2Client.getAccessToken()).token;

    if (!accessToken) {
      throw new Error("Failed to get access token");
    }

    console.log("Access token obtained, fetching GMB accounts");

    // Fetch the accounts from the Google My Business API
    const accountsUrl =
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
    console.log("Requesting accounts from:", accountsUrl);

    const accountsResponse = await fetch(accountsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!accountsResponse.ok) {
      const errorStatus = accountsResponse.status;
      const errorText = await accountsResponse.text();
      console.error("Error response status:", errorStatus);
      console.error("Error response text:", errorText);
      throw new Error(
        `Error fetching accounts: ${accountsResponse.statusText} (${errorStatus})`
      );
    }

    const accountsData = await accountsResponse.json();
    console.log(`Received ${accountsData.accounts?.length || 0} accounts`);

    return NextResponse.json({
      accounts: accountsData.accounts || [],
    });
  } catch (error) {
    console.error("Error fetching GMB accounts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch GMB accounts",
      },
      { status: 500 }
    );
  }
}
