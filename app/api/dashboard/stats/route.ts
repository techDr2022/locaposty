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

    // Get the locationId from query params
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Get date 7 days ago for weekly stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get date 30 days ago for monthly stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get date 14 days ago to compare with previous week
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get all scheduled posts for the current week
    const postsScheduled = await prisma.post.count({
      where: {
        locationId,
        scheduledAt: {
          gte: sevenDaysAgo,
        },
        status: "SCHEDULED",
      },
    });

    // Get scheduled posts from previous week for comparison
    const postsScheduledPreviousWeek = await prisma.post.count({
      where: {
        locationId,
        scheduledAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
        status: "SCHEDULED",
      },
    });

    // Calculate the change percentage for posts
    const postsChange =
      postsScheduledPreviousWeek > 0
        ? Math.round(
            ((postsScheduled - postsScheduledPreviousWeek) /
              postsScheduledPreviousWeek) *
              100
          )
        : null;

    // Get profile views from insights for the last 30 days
    const profileViews = await prisma.insight.aggregate({
      _sum: {
        value: true,
      },
      where: {
        locationId,
        type: "VIEWS",
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get customer actions (clicks, calls, direction requests) from insights
    const customerActions = await prisma.insight.aggregate({
      _sum: {
        value: true,
      },
      where: {
        locationId,
        type: {
          in: ["CLICKS", "PHONE_CALLS", "DIRECTION_REQUESTS"],
        },
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Build stats response
    const stats = {
      postsScheduled,
      profileViews: profileViews._sum.value || 0,
      customerActions: customerActions._sum.value || 0,
      changes: {
        posts:
          postsChange !== null
            ? `${postsChange > 0 ? "+" : ""}${postsChange}%`
            : null,
      },
      trends: {
        posts: postsChange === null ? null : postsChange >= 0 ? "up" : "down",
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
