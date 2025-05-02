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
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string)
      : 5;

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Get current date
    const now = new Date();

    // Find upcoming posts that are scheduled to be published after now
    const upcomingPosts = await prisma.post.findMany({
      where: {
        locationId,
        scheduledAt: {
          gte: now,
        },
        status: "SCHEDULED",
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        scheduledAt: true,
        type: true,
        mediaUrls: true,
        location: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    // Transform posts to match the expected format in the frontend
    const formattedPosts = upcomingPosts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      date: post.scheduledAt.toISOString(),
      type:
        post.type === "WHATS_NEW"
          ? "update"
          : post.type === "EVENT"
            ? "event"
            : "offer",
      hasMedia: post.mediaUrls.length > 0,
      mediaCount: post.mediaUrls.length || undefined,
      location:
        post.location.name || post.location.address || "Unknown location",
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching upcoming posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming posts" },
      { status: 500 }
    );
  }
}
