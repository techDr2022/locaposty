import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/db";

// Define a type for Google My Business location
interface GMBLocation {
  name: string;
  title?: string;
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
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Save locations API called");

    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { accountId, locations } = body;

    console.log(
      `Request received for account: ${accountId}, locations count: ${locations?.length || 0}`
    );

    if (
      !accountId ||
      !locations ||
      !Array.isArray(locations) ||
      locations.length === 0
    ) {
      console.log("Invalid request parameters", {
        accountId,
        locationsLength: locations?.length,
      });
      return NextResponse.json(
        { error: "Invalid request parameters" },
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
        ownedOrganizations: {
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    console.log("User found:", {
      userId: user?.id,
      hasAccessToken: !!user?.googleAccessToken,
      hasRefreshToken: !!user?.googleRefreshToken,
      organizationsCount: user?.ownedOrganizations?.length || 0,
    });

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 400 }
      );
    }

    // Get the first organization this user owns (if any)
    const organizationId = user.ownedOrganizations[0]?.id;

    if (!organizationId) {
      console.log("User doesn't own any organizations");

      // Create a default organization for the user if none exists
      const newOrg = await prisma.organization.create({
        data: {
          name: "Default Organization",
          ownerId: user.id,
        },
      });

      console.log("Created default organization:", newOrg.id);

      // Save locations to the database with the new organization
      const savedLocations = await Promise.all(
        locations.map(async (location: GMBLocation) => {
          try {
            // Extract the location ID from the name field
            // The name format is typically "accounts/{accountId}/locations/{locationId}"
            const locationPathParts = location.name.split("/");
            const locationId = locationPathParts[locationPathParts.length - 1];

            console.log(
              `Processing location: ${location.name}, extracted ID: ${locationId}`
            );

            if (!locationId) {
              console.error(
                "Could not extract location ID from:",
                location.name
              );
              throw new Error(`Invalid location name format: ${location.name}`);
            }

            // Extract the logo URL from the profile if available
            const logoUrl =
              location.profile?.logoUrl ||
              location.profile?.coverPhoto?.url ||
              (location.profile?.photos && location.profile.photos.length > 0
                ? location.profile.photos[0].url
                : null);

            // Check if this location already exists in our database
            const existingLocation = await prisma.location.findUnique({
              where: { gmbLocationId: locationId },
            });

            const locationAddress = location.storefrontAddress
              ? `${location.storefrontAddress.addressLines.join(", ")}, ${location.storefrontAddress.locality}, ${location.storefrontAddress.administrativeArea} ${location.storefrontAddress.postalCode}`
              : null;

            console.log(
              `Location ${locationId}: ${existingLocation ? "Updating existing" : "Creating new"}`
            );

            if (existingLocation) {
              // Update the existing location with fresh data
              return prisma.location.update({
                where: { id: existingLocation.id },
                data: {
                  name: location.title || "",
                  gmbLocationName: location.title || "",
                  address: locationAddress,
                  phone: location.phoneNumbers?.primaryPhone || null,
                  websiteUrl: location.websiteUri || null,
                  logoUrl: logoUrl,
                  latitude: location.latlng?.latitude || null,
                  longitude: location.latlng?.longitude || null,
                  accessToken: user.googleAccessToken,
                  refreshToken: user.googleRefreshToken,
                  tokenExpiresAt: user.googleTokenExpiresAt,
                  lastSyncedAt: new Date(),
                  gmbAccountId: accountId,
                  // Connect the user
                  users: {
                    connect: { id: user.id },
                  },
                },
              });
            } else {
              // Create a new location
              return prisma.location.create({
                data: {
                  gmbLocationId: locationId,
                  name: location.title || "",
                  gmbLocationName: location.title || "",
                  address: locationAddress,
                  phone: location.phoneNumbers?.primaryPhone || null,
                  websiteUrl: location.websiteUri || null,
                  logoUrl: logoUrl,
                  latitude: location.latlng?.latitude || null,
                  longitude: location.latlng?.longitude || null,
                  accessToken: user.googleAccessToken,
                  refreshToken: user.googleRefreshToken,
                  tokenExpiresAt: user.googleTokenExpiresAt,
                  lastSyncedAt: new Date(),
                  gmbAccountId: accountId,
                  // Connect the organization
                  organization: {
                    connect: { id: newOrg.id },
                  },
                  // Connect the user
                  users: {
                    connect: { id: user.id },
                  },
                },
              });
            }
          } catch (err) {
            console.error("Error processing location:", err);
            // Instead of failing the entire process, return null and filter later
            return null;
          }
        })
      );

      // Filter out any null values (failed locations)
      const successfulSaves = savedLocations.filter((loc) => loc !== null);

      console.log(
        `Successfully saved ${successfulSaves.length} out of ${locations.length} locations`
      );

      return NextResponse.json({
        success: true,
        message: `Successfully saved ${successfulSaves.length} locations`,
        locationIds: successfulSaves.map((loc) => loc?.id),
      });
    }

    console.log("Using organization:", organizationId);

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
      console.log("Refreshing expired token");
      const { credentials } = await oauth2Client.refreshAccessToken();

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

      console.log("Token refreshed successfully");
    }

    // Get the access token
    const accessToken = (await oauth2Client.getAccessToken()).token;

    if (!accessToken) {
      console.error("Failed to get access token");
      throw new Error("Failed to get access token");
    }

    console.log("Access token obtained, proceeding to save locations");

    // Save locations to the database
    const savedLocations = await Promise.all(
      locations.map(async (location: GMBLocation) => {
        try {
          // Extract the location ID from the name field
          // The name format is typically "accounts/{accountId}/locations/{locationId}"
          const locationPathParts = location.name.split("/");
          const locationId = locationPathParts[locationPathParts.length - 1];

          console.log(
            `Processing location: ${location.name}, extracted ID: ${locationId}`
          );

          if (!locationId) {
            console.error("Could not extract location ID from:", location.name);
            throw new Error(`Invalid location name format: ${location.name}`);
          }

          // Extract the logo URL from the profile if available
          const logoUrl =
            location.profile?.logoUrl ||
            location.profile?.coverPhoto?.url ||
            (location.profile?.photos && location.profile.photos.length > 0
              ? location.profile.photos[0].url
              : null);

          // Check if this location already exists in our database
          const existingLocation = await prisma.location.findUnique({
            where: { gmbLocationId: locationId },
          });

          const locationAddress = location.storefrontAddress
            ? `${location.storefrontAddress.addressLines.join(", ")}, ${location.storefrontAddress.locality}, ${location.storefrontAddress.administrativeArea} ${location.storefrontAddress.postalCode}`
            : null;

          console.log(
            `Location ${locationId}: ${existingLocation ? "Updating existing" : "Creating new"}`
          );

          if (existingLocation) {
            // Update the existing location with fresh data
            return prisma.location.update({
              where: { id: existingLocation.id },
              data: {
                name: location.title || "",
                gmbLocationName: location.title || "",
                address: locationAddress,
                phone: location.phoneNumbers?.primaryPhone || null,
                websiteUrl: location.websiteUri || null,
                logoUrl: logoUrl,
                latitude: location.latlng?.latitude || null,
                longitude: location.latlng?.longitude || null,
                accessToken: accessToken,
                refreshToken: user.googleRefreshToken,
                tokenExpiresAt: user.googleTokenExpiresAt,
                lastSyncedAt: new Date(),
                gmbAccountId: accountId,
                // Connect the user
                users: {
                  connect: { id: user.id },
                },
              },
            });
          } else {
            // Create a new location
            return prisma.location.create({
              data: {
                gmbLocationId: locationId,
                name: location.title || "",
                gmbLocationName: location.title || "",
                address: locationAddress,
                phone: location.phoneNumbers?.primaryPhone || null,
                websiteUrl: location.websiteUri || null,
                logoUrl: logoUrl,
                latitude: location.latlng?.latitude || null,
                longitude: location.latlng?.longitude || null,
                accessToken: accessToken,
                refreshToken: user.googleRefreshToken,
                tokenExpiresAt: user.googleTokenExpiresAt,
                lastSyncedAt: new Date(),
                gmbAccountId: accountId,
                // Connect the organization
                organization: {
                  connect: { id: organizationId },
                },
                // Connect the user
                users: {
                  connect: { id: user.id },
                },
              },
            });
          }
        } catch (err) {
          console.error("Error processing location:", err);
          // Instead of failing the entire process, return null and filter later
          return null;
        }
      })
    );

    // Filter out any null values (failed locations)
    const successfulSaves = savedLocations.filter((loc) => loc !== null);

    console.log(
      `Successfully saved ${successfulSaves.length} out of ${locations.length} locations`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${successfulSaves.length} locations`,
      locationIds: successfulSaves.map((loc) => loc?.id),
    });
  } catch (error) {
    console.error("Error saving GMB locations:", error);
    return NextResponse.json(
      {
        error: `Failed to save GMB locations: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
