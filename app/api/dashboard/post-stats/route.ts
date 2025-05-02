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

    // Get all post statistics by status
    const postStats = await Promise.all([
      // Count scheduled posts
      prisma.post.count({
        where: {
          locationId,
          status: "SCHEDULED",
        },
      }),
      // Count published posts
      prisma.post.count({
        where: {
          locationId,
          status: "PUBLISHED",
        },
      }),
      // Count draft posts
      prisma.post.count({
        where: {
          locationId,
          status: "DRAFT",
        },
      }),
      // Count failed posts
      prisma.post.count({
        where: {
          locationId,
          status: "FAILED",
        },
      }),
      // Count deleted posts
      prisma.post.count({
        where: {
          locationId,
          status: "DELETED",
        },
      }),
      // Count posts by type - WHATS_NEW
      prisma.post.count({
        where: {
          locationId,
          type: "WHATS_NEW",
        },
      }),
      // Count posts by type - EVENT
      prisma.post.count({
        where: {
          locationId,
          type: "EVENT",
        },
      }),
      // Count posts by type - OFFER
      prisma.post.count({
        where: {
          locationId,
          type: "OFFER",
        },
      }),
    ]);

    // Get date ranges for time-based stats
    const now = new Date();

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // This month (start of month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Additional time-based statistics
    const timeBasedStats = await Promise.all([
      // Posts scheduled for the next 7 days
      prisma.post.count({
        where: {
          locationId,
          scheduledAt: {
            gte: now,
            lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: "SCHEDULED",
        },
      }),
      // Posts published in the last 7 days
      prisma.post.count({
        where: {
          locationId,
          publishedAt: {
            gte: sevenDaysAgo,
          },
          status: "PUBLISHED",
        },
      }),
      // Posts published in the last 30 days
      prisma.post.count({
        where: {
          locationId,
          publishedAt: {
            gte: thirtyDaysAgo,
          },
          status: "PUBLISHED",
        },
      }),
      // Posts published this month
      prisma.post.count({
        where: {
          locationId,
          publishedAt: {
            gte: startOfMonth,
          },
          status: "PUBLISHED",
        },
      }),
    ]);

    // Format the response
    const stats = {
      byStatus: {
        scheduled: postStats[0],
        published: postStats[1],
        draft: postStats[2],
        failed: postStats[3],
        deleted: postStats[4],
      },
      byType: {
        updates: postStats[5],
        events: postStats[6],
        offers: postStats[7],
      },
      byTime: {
        scheduledNext7Days: timeBasedStats[0],
        publishedLast7Days: timeBasedStats[1],
        publishedLast30Days: timeBasedStats[2],
        publishedThisMonth: timeBasedStats[3],
      },
      total:
        postStats[0] +
        postStats[1] +
        postStats[2] +
        postStats[3] +
        postStats[4],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching post stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch post statistics" },
      { status: 500 }
    );
  }
}
