import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(request.url);
    const locationId = url.searchParams.get("locationId");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "updateTime";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const replySource = url.searchParams.get("replySource");
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!)
      : 100;
    const page = url.searchParams.get("page")
      ? parseInt(url.searchParams.get("page")!)
      : 1;
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    // Filter by user's locations
    const userLocations = await prisma.location.findMany({
      where: {
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const userLocationIds = userLocations.map((location) => location.id);
    where.locationId = { in: userLocationIds };

    // Apply additional filters
    if (locationId) {
      where.locationId = locationId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { authorName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (replySource) {
      // Find reviews that have replies with the specified source
      where.replies = {
        some: {
          source: replySource,
        },
      };
    } else if (replySource === "none") {
      // Find reviews with no replies
      where.replies = {
        none: {},
      };
    }

    // Count total reviews matching the criteria
    const totalReviews = await prisma.review.count({ where });

    // Define sort options
    const orderBy: any = {};
    if (sortBy === "rating") {
      orderBy.rating = sortOrder;
    } else if (sortBy === "createTime") {
      orderBy.createTime = sortOrder;
    } else if (sortBy === "updateTime") {
      orderBy.updateTime = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        location: {
          select: {
            name: true,
            gmbLocationName: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get all locations for the user (for filtering)
    const locations = await prisma.location.findMany({
      where: {
        id: { in: userLocationIds },
      },
      select: {
        id: true,
        name: true,
        gmbLocationName: true,
      },
    });

    return NextResponse.json({
      reviews,
      totalReviews,
      locations,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
