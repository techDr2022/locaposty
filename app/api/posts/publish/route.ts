import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { schedulePost } from "@/lib/queue";

// POST: Immediately publish a post
export async function POST(request: NextRequest) {
  console.log("[PUBLISH API] Request received");

  try {
    const session = await getServerSession(authOptions);
    console.log("[PUBLISH API] Session:", session?.user?.email);

    if (!session?.user?.id) {
      console.log("[PUBLISH API] Error: Not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[PUBLISH API] Request body:", body);

    const { postId } = body;

    if (!postId) {
      console.log("[PUBLISH API] Error: Missing postId");
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check if post exists and belongs to user
    console.log(
      `[PUBLISH API] Looking for post: ${postId}, user: ${session.user.id}`
    );
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: session.user.id,
      },
      include: {
        location: true,
      },
    });

    console.log(
      `[PUBLISH API] Post found:`,
      post ? `Yes, status: ${post.status}` : "No"
    );

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or you don't have access" },
        { status: 404 }
      );
    }

    // Check if post has a valid location
    if (!post.location) {
      console.log(
        `[PUBLISH API] Post has no location: locationId=${post.locationId}`
      );

      // Update post status to FAILED
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error:
            "Post cannot be published because it doesn't have a location assigned",
          status: "FAILED",
        },
        { status: 400 }
      );
    }

    // Check if location is connected to Google Business Profile
    if (!post.location.gmbLocationId) {
      console.log(
        `[PUBLISH API] Location has no Google Business ID: ${post.location.id}`
      );

      // Update post status to FAILED
      const failedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error:
            "Post cannot be published because the assigned location is not connected to Google Business Profile",
          status: "FAILED",
          post: failedPost,
        },
        { status: 400 }
      );
    }

    // Check if location has a valid authentication token
    if (!post.location.refreshToken) {
      console.log(
        `[PUBLISH API] Location has no refresh token: ${post.location.id}`
      );

      // Update post status to FAILED
      const failedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error:
            "Location is not properly authenticated with Google. Please reconnect the location in settings.",
          status: "FAILED",
          post: failedPost,
        },
        { status: 400 }
      );
    }

    // Check if post can be published (must be DRAFT or SCHEDULED)
    if (post.status !== "DRAFT" && post.status !== "SCHEDULED") {
      console.log(
        `[PUBLISH API] Post status (${post.status}) not valid for publishing`
      );
      return NextResponse.json(
        {
          error: `Post cannot be published because its status is ${post.status}. Only draft or scheduled posts can be published.`,
        },
        { status: 400 }
      );
    }

    console.log(`[PUBLISH API] Updating post status to PUBLISHED`);
    // Update post status to PUBLISHED
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        scheduledAt: new Date(), // Update scheduled time to now
        publishedAt: new Date(), // Set the published time
      },
      include: {
        location: true, // Include location data in the response
      },
    });

    console.log(
      `[PUBLISH API] Post updated. Adding to queue for immediate processing`
    );

    // Add to queue for immediate processing
    try {
      await schedulePost(
        postId,
        new Date(), // Use current time (no delay)
        session.user.email || ""
      );
      console.log(
        `[PUBLISH API] Successfully queued post for immediate publishing`
      );
    } catch (queueError) {
      console.error(`[PUBLISH API] Queue error:`, queueError);

      // Mark the post as FAILED since we couldn't queue it
      const failedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: "FAILED",
        },
        include: {
          location: true,
        },
      });

      // Return error with the failed post
      return NextResponse.json(
        {
          error:
            "Failed to queue post for publishing: " +
            (queueError instanceof Error
              ? queueError.message
              : "Unknown queue error"),
          post: failedPost,
          status: "FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("[PUBLISH API] Unexpected error:", error);

    // Try to update the post status to FAILED
    try {
      const { postId } = await request.json();
      if (postId) {
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: "FAILED",
          },
        });
      }
    } catch (updateError) {
      console.error("[PUBLISH API] Error updating post status:", updateError);
    }

    return NextResponse.json(
      {
        error: "Failed to publish post",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "FAILED",
      },
      { status: 500 }
    );
  }
}
