import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, content, tone } = await request.json();

    if (!reviewId || !content) {
      return NextResponse.json(
        { error: "Review ID and content are required" },
        { status: 400 }
      );
    }

    // Find the review to make sure it exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Create a new reply with AI_GENERATED source but not published yet
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId: session.user.id,
        content,
        source: "AI_GENERATED",
        tone: tone || "FRIENDLY",
        isPublished: false, // Not published yet - will be reviewed by user first
      },
    });

    // Update the review status to acknowledge the AI reply
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        isProcessed: true,
      },
    });

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Error saving AI reply:", error);
    return NextResponse.json(
      { error: "Failed to save AI reply" },
      { status: 500 }
    );
  }
}
