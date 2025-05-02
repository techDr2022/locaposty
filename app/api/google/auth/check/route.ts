import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find the user to check if they have Google tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        // These fields need to be added to the User model
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
      },
    });

    // Check if the user has Google tokens
    const isConnected = !!(user?.googleAccessToken && user?.googleRefreshToken);

    return NextResponse.json({ isConnected });
  } catch (error) {
    console.error("Error checking Google connection:", error);
    return NextResponse.json(
      { error: "Failed to check Google connection" },
      { status: 500 }
    );
  }
}
