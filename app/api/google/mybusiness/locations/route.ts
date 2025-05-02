import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/db";

// Define a type for Google My Business location
interface GMBLocation {
  name: string;
  title?: string;
  profile?: {
    logoUrl?: string;
    coverPhoto?: {
      url?: string;
      [key: string]: unknown;
    };
    photos?: Array<{
      url?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    [key: string]: unknown;
  };
  phoneNumbers?: {
    primaryPhone?: string;
    [key: string]: unknown;
  };
  websiteUri?: string;
  latlng?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get account ID from query params
    const accountId = request.nextUrl.searchParams.get("accountId");
    console.log("Received request for account ID:", accountId);

    if (!accountId) {
      console.log("Missing accountId parameter");
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Find the user to get their Google tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
      },
    });

    console.log("User tokens found:", {
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
      console.log("Token expired, refreshing...");
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

    console.log("Access token obtained successfully");

    // Define the read mask based on the location model - simplified to avoid API errors
    const readMask = "name,title,storefrontAddress,phoneNumbers,latlng,profile";

    // Log the URL we're about to fetch
    const locationsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=${readMask}&pageSize=100`;
    console.log("Requesting locations from:", locationsUrl);

    // Fetch the locations from the Google My Business API
    const locationsResponse = await fetch(locationsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!locationsResponse.ok) {
      // Log detailed error information
      const errorStatus = locationsResponse.status;
      const errorText = await locationsResponse.text();
      console.error("Error response status:", errorStatus);
      console.error("Error response text:", errorText);
      throw new Error(
        `Error fetching locations: ${locationsResponse.statusText} (${errorStatus})`
      );
    }

    const locationsData = await locationsResponse.json();
    console.log(
      `Received ${locationsData.locations?.length || 0} locations from Google API`
    );

    // Process locations to extract logo URLs if available
    const processedLocations = (locationsData.locations || []).map(
      (location: GMBLocation) => {
        // Create a processed location object with all existing data
        const processedLocation = { ...location };

        // Extract logo URL if available in the profile
        if (location.profile && location.profile.logoUrl) {
          console.log(
            `Logo URL found for location ${location.title}: ${location.profile.logoUrl}`
          );
          processedLocation.logoUrl = location.profile.logoUrl;
        } else if (location.profile) {
          console.log(`No logo URL found for location ${location.title}`);
        }

        return processedLocation;
      }
    );

    return NextResponse.json({
      locations: processedLocations,
    });
  } catch (error) {
    console.error("Error fetching GMB locations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch GMB locations",
      },
      { status: 500 }
    );
  }
}
