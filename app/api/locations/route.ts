import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the userId from query params or use the session user's id
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    try {
      // Fetch locations associated with the user
      const userLocations = await prisma.location.findMany({
        where: {
          users: {
            some: {
              id: userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          gmbLocationName: true,
          address: true,
          logoUrl: true,
          organizationId: true,
          lastFetchedTimestamp: true,
          autoReplyEnabled: true,
          autoPostEnabled: true,
          replyTonePreference: true,
        },
      });

      // Return the response format expected by the client
      return NextResponse.json({ locations: userLocations });
    } catch (dbError) {
      console.error("Database error fetching locations:", dbError);

      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
