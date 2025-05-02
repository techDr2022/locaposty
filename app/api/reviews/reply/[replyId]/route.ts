import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshLocationToken } from "@/lib/refreshLocationToken";

interface Props {
  params: {
    replyId: string;
  };
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { replyId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, tone } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Find the reply and include the related review and location info
    const reply = await prisma.reviewReply.findUnique({
      where: {
        id: replyId,
      },
      include: {
        review: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Get a fresh access token
    const accessToken = await refreshLocationToken(reply.review.locationId);

    // Update the reply on Google
    try {
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${reply.review.location.gmbAccountId}/locations/${reply.review.location.gmbLocationId}/reviews/${reply.review.reviewId}/reply`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: content,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google reply edit error:", errorData);

        return NextResponse.json(
          { error: "Failed to update reply on Google", details: errorData },
          { status: 500 }
        );
      }

      // Update the reply in the database
      const updatedReply = await prisma.reviewReply.update({
        where: {
          id: replyId,
        },
        data: {
          content,
          tone: tone || reply.tone,
          isPublished: true,
          publishedAt: new Date(),
          source: "MANUAL",
          updatedAt: new Date(),
          userId: session.user.id, // Update to the user who edited the reply
        },
      });

      return NextResponse.json({
        success: true,
        reply: updatedReply,
      });
    } catch (error) {
      console.error("Error updating reply on Google:", error);

      return NextResponse.json(
        { error: "Failed to update reply on Google", details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in edit reply API:", error);
    return NextResponse.json(
      { error: "Failed to process reply edit" },
      { status: 500 }
    );
  }
}
