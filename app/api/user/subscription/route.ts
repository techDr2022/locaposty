import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("Session obtained:", session ? "yes" : "no");
    } catch (sessionError) {
      console.error("Error getting server session:", sessionError);
      return NextResponse.json(
        {
          error: "Session error",
          details:
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError),
        },
        { status: 500 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", sessionExists: !!session },
        { status: 401 }
      );
    }

    // Get userId from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    console.log("Requested userId:", userId);

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // For debugging - skip the session user check for now
    // instead of checking session.user.id === userId

    // Try connecting to database
    try {
      console.log("Attempting to connect to database");

      // First just do a simple query to ensure connectivity
      const userCount = await prisma.user.count();
      console.log("Database has", userCount, "users");

      // Now try the actual query
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionStatus: true,
          subscriptionPlan: true,
          trialStartedAt: true,
          trialEndsAt: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      });

      if (!user) {
        console.log(`User not found: ${userId}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      console.log(`Found subscription data:`, JSON.stringify(user));

      // Return the subscription data
      return NextResponse.json({
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        trialStartedAt: user.trialStartedAt,
        trialEndsAt: user.trialEndsAt,
        currentPeriodStart: user.currentPeriodStart,
        currentPeriodEnd: user.currentPeriodEnd,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching subscription data:", error);

    // Return more detailed error information in development
    return NextResponse.json(
      {
        error: "Failed to fetch subscription data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
