import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { schedulePost, unschedulePost, reschedulePost } from "@/lib/queue";

// GET: Fetch posts with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // Normalize and validate the type if present
    let typeValue = null;
    if (type) {
      // Convert to the correct format expected by Prisma
      const normalizedType = type.toUpperCase();
      const validTypes = ["WHATS_NEW", "EVENT", "OFFER"];

      if (validTypes.includes(normalizedType)) {
        typeValue = normalizedType;
      }
    }

    // Build the query that Prisma expects
    const where = {
      userId: userId,
      ...(locationId && locationId !== "all" ? { locationId } : {}),
      ...(status ? { status: status.toUpperCase() } : {}),
      ...(typeValue ? { type: typeValue } : {}),
    };

    // TypeScript doesn't know what the database expects, but we do
    // Use type assertion to tell TypeScript to trust us
    const prismaWhere = where as any;

    // Get posts with pagination
    const posts = await prisma.post.findMany({
      where: prismaWhere,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            gmbLocationName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get total count for pagination
    const totalCount = await prisma.post.count({ where: prismaWhere });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST: Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      locationId,
      title,
      content,
      type = "WHATS_NEW", // Default type matching Prisma schema
      mediaUrls,
      scheduledAt,
      eventStart,
      eventEnd,
      offerStart,
      offerEnd,
      couponCode,
      recurType,
      recurEndsAt,
      callToAction,
      status = "SCHEDULED",
    } = body;

    // Validate required fields
    if (!locationId || !title || !content || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if location belongs to user
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found or you don't have access" },
        { status: 404 }
      );
    }

    // Validate the type against correct enum values from Prisma schema
    const validTypes = ["WHATS_NEW", "EVENT", "OFFER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid post type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create post data - use type assertion
    const postData = {
      userId: session.user.id,
      locationId,
      title,
      content,
      type,
      mediaUrls: mediaUrls || [],
      scheduledAt: new Date(scheduledAt),
      status,
      eventStart: eventStart ? new Date(eventStart) : null,
      eventEnd: eventEnd ? new Date(eventEnd) : null,
      offerStart: offerStart ? new Date(offerStart) : null,
      offerEnd: offerEnd ? new Date(offerEnd) : null,
      couponCode,
      recurType,
      recurEndsAt: recurEndsAt ? new Date(recurEndsAt) : null,
      callToAction: callToAction,
    } as any;

    // Create post
    const post = await prisma.post.create({
      data: postData,
    });

    console.log(
      `[POST DEBUG] Created post ${post.id} with status ${post.status}`
    );

    // Handle different post statuses
    if (status === "SCHEDULED") {
      console.log(
        `[POST DEBUG] Scheduling post ${post.id} for future publishing at ${scheduledAt}`
      );
      // Schedule post for future publishing
      await schedulePost(
        post.id,
        new Date(scheduledAt),
        session.user.email || ""
      );
      console.log(`[POST DEBUG] Successfully scheduled post ${post.id}`);
    } else if (status === "PUBLISHED") {
      console.log(`[POST DEBUG] Publishing post ${post.id} immediately`);
      // Immediate publishing - add to queue with no delay
      await schedulePost(
        post.id,
        new Date(), // Use current time (no delay)
        session.user.email || ""
      );
      console.log(
        `[POST DEBUG] Successfully queued post ${post.id} for immediate publishing`
      );
    } else {
      console.log(
        `[POST DEBUG] Post ${post.id} saved as draft, no scheduling needed`
      );
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      locationId,
      title,
      content,
      type,
      mediaUrls,
      scheduledAt,
      eventStart,
      eventEnd,
      offerStart,
      offerEnd,
      couponCode,
      recurType,
      recurEndsAt,
      callToAction,
      status,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found or you don't have access" },
        { status: 404 }
      );
    }

    // If changing location, check if new location belongs to user
    if (locationId && locationId !== existingPost.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: locationId,
          users: {
            some: {
              id: session.user.id,
            },
          },
        },
      });

      if (!location) {
        return NextResponse.json(
          { error: "Location not found or you don't have access" },
          { status: 404 }
        );
      }
    }

    // Prepare update data - using object spreads for type safety
    const updateData = {
      ...(locationId ? { locationId } : {}),
      ...(title ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(type ? { type } : {}),
      ...(mediaUrls ? { mediaUrls } : {}),
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
      ...(status ? { status } : {}),
      ...(eventStart !== undefined
        ? { eventStart: eventStart ? new Date(eventStart) : null }
        : {}),
      ...(eventEnd !== undefined
        ? { eventEnd: eventEnd ? new Date(eventEnd) : null }
        : {}),
      ...(offerStart !== undefined
        ? { offerStart: offerStart ? new Date(offerStart) : null }
        : {}),
      ...(offerEnd !== undefined
        ? { offerEnd: offerEnd ? new Date(offerEnd) : null }
        : {}),
      ...(couponCode !== undefined ? { couponCode } : {}),
      ...(recurType !== undefined ? { recurType } : {}),
      ...(recurEndsAt !== undefined
        ? { recurEndsAt: recurEndsAt ? new Date(recurEndsAt) : null }
        : {}),
      ...(callToAction !== undefined ? { callToAction } : {}),
    };

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    // Handle scheduling updates
    if (status === "DELETED" || status === "DRAFT") {
      // Unschedule if post is deleted or changed to draft
      await unschedulePost(id);
    } else if (status === "SCHEDULED" && scheduledAt) {
      // If post is scheduled or updating schedule time
      const scheduledDate = new Date(scheduledAt);

      if (existingPost.status !== "SCHEDULED") {
        // If changing from draft/deleted to scheduled
        await schedulePost(id, scheduledDate, session.user.email || "");
      } else if (
        existingPost.scheduledAt.getTime() !== scheduledDate.getTime()
      ) {
        // If just changing the scheduled time
        await reschedulePost(id, scheduledDate, session.user.email || "");
      }
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a post (sets status to DELETED)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found or you don't have access" },
        { status: 404 }
      );
    }

    // Update post status to DELETED
    await prisma.post.update({
      where: { id },
      data: { status: "DELETED" },
    });

    // Unschedule the post from the queue
    await unschedulePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
