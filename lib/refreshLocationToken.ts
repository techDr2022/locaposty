import { prisma } from "@/lib/prisma";
import { OAuth2Client } from "google-auth-library";

export async function refreshLocationToken(
  locationId: string
): Promise<string> {
  try {
    console.log(`[TOKEN] Fetching tokens for location ${locationId}`);

    // Get location with tokens
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    if (!location.refreshToken) {
      throw new Error(`No refresh token found for location ${locationId}`);
    }

    console.log(`[TOKEN] Found refresh token for location ${locationId}`);

    // Check if current token is still valid
    if (location.accessToken && location.tokenExpiresAt) {
      const now = new Date();
      const expiryDate = new Date(location.tokenExpiresAt);

      // If token is still valid (with 5 minute buffer), return it
      if (expiryDate > new Date(now.getTime() + 5 * 60 * 1000)) {
        console.log(
          `[TOKEN] Using existing valid token for location ${locationId} ${location.accessToken}`
        );
        return location.accessToken;
      }
    }

    // Token expired or missing, refresh it
    console.log(`[TOKEN] Refreshing token for location ${locationId}`);
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID_GMB,
      process.env.GOOGLE_CLIENT_SECRET_GMB,
      `${process.env.NEXTAUTH_URL}/api/google/auth/callback`
    );

    // Log the OAuth configuration for debugging
    console.log(
      `[TOKEN] OAuth2 client ID: ${process.env.GOOGLE_CLIENT_ID_GMB?.substring(0, 5)}...`
    );
    console.log(
      `[TOKEN] OAuth2 callback URL: ${process.env.NEXTAUTH_URL}/api/google/auth/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: location.refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      console.log(credentials);

      if (!credentials.access_token) {
        throw new Error(
          `Failed to refresh access token for location ${locationId}`
        );
      }

      // Calculate expiry time
      const expiryTime = new Date();
      if (credentials.expiry_date) {
        expiryTime.setTime(credentials.expiry_date);
      } else {
        // Default expiry: 1 hour
        expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000);
      }

      // Update location with new token
      await prisma.location.update({
        where: { id: locationId },
        data: {
          accessToken: credentials.access_token,
          tokenExpiresAt: expiryTime,
        },
      });

      console.log(
        `[TOKEN] Successfully refreshed token for location ${locationId}`
      );
      return credentials.access_token;
    } catch (refreshError) {
      console.error(`[TOKEN ERROR] OAuth refresh failed:`, refreshError);

      // Mark the refresh token as invalid by clearing it
      await prisma.location.update({
        where: { id: locationId },
        data: {
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
        },
      });

      throw new Error(
        `Token refresh failed. The location needs to be re-authenticated.`
      );
    }
  } catch (error) {
    console.error(
      `[TOKEN ERROR] Failed to refresh token for location ${locationId}:`,
      error
    );
    throw error;
  }
}
