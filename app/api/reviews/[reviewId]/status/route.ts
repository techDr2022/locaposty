import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  params: {
    reviewId: string;
  };
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { reviewId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Check if valid status value
    if (!["PENDING", "REPLIED", "FLAGGED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Find the review to ensure it exists
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
      include: {
        location: {
          include: {
            users: {
              where: {
                id: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify user has access to this review
    if (review.location.users.length === 0) {
      return NextResponse.json(
        { error: "You do not have permission to update this review" },
        { status: 403 }
      );
    }

    // Update review status
    const updatedReview = await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error("Error updating review status:", error);
    return NextResponse.json(
      { error: "Failed to update review status" },
      { status: 500 }
    );
  }
}
