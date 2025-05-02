import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshLocationToken } from "@/lib/refreshLocationToken";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, content, tone, source } = await request.json();

    if (!reviewId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        location: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Create a reply in the database
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId: session.user.id,
        content,
        source: source || "MANUAL",
        tone: tone || "FRIENDLY",
        isPublished: false, // Set to false until published to Google
      },
    });

    // Get a fresh access token
    const accessToken = await refreshLocationToken(review.locationId);

    // Post the reply to Google
    try {
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${review.location.gmbAccountId}/locations/${review.location.gmbLocationId}/reviews/${review.reviewId}/reply`,
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
        console.error("Google reply error:", errorData);

        return NextResponse.json(
          { error: "Failed to post reply to Google", details: errorData },
          { status: 500 }
        );
      }

      // Update the reply as published
      await prisma.reviewReply.update({
        where: { id: reply.id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      // Update the review status to REPLIED
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: "REPLIED",
        },
      });

      return NextResponse.json({
        success: true,
        reply: {
          ...reply,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error posting reply to Google:", error);

      return NextResponse.json(
        { error: "Failed to post reply to Google", details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in review reply API:", error);
    return NextResponse.json(
      { error: "Failed to process reply" },
      { status: 500 }
    );
  }
}
