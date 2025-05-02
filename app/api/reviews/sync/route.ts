import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshLocationToken } from "@/lib/refreshLocationToken";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { locationId } = data;

    // If locationId is provided, only sync that location
    const locations = locationId
      ? await prisma.location.findMany({
          where: {
            id: locationId,
            accessToken: { not: null },
            refreshToken: { not: null },
          },
        })
      : await prisma.location.findMany({
          where: {
            accessToken: { not: null },
            refreshToken: { not: null },
          },
        });

    if (locations.length === 0) {
      return NextResponse.json(
        { error: "No locations available for syncing" },
        { status: 400 }
      );
    }

    const results = [];

    for (const location of locations) {
      try {
        // List reviews for this location
        const token = await refreshLocationToken(location.id);

        console.log(
          "url",
          `https://mybusiness.googleapis.com/v4/${location.gmbAccountId}/locations/${location.gmbLocationId}/reviews`
        );

        const reviewResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/${location.gmbAccountId}/locations/${location.gmbLocationId}/reviews`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const reviewData = await reviewResponse.json();
        const reviews = reviewData.reviews || [];

        console.log(reviewData);
        console.log(reviews[0].reviewReply);

        const filteredReviews = reviews.filter((review) => {
          const lastFetchedTimestamp =
            location.lastFetchedTimestamp ||
            new Date(Date.now() - 60 * 60 * 1000); // 1 hour before current time
          const createTime = new Date(review.createTime);
          return createTime > lastFetchedTimestamp;
        });

        console.log(filteredReviews);

        // Update last fetched timestamp
        if (filteredReviews.length > 0) {
          await prisma.location.update({
            where: { id: location.id },
            data: { lastFetchedTimestamp: new Date() },
          });
        }
        // Store the reviews in the database
        for (const review of filteredReviews) {
          const existingReview = await prisma.review.findUnique({
            where: { reviewId: review.reviewId },
          });

          if (!existingReview) {
            const starRatingMap: Record<string, number> = {
              ONE: 1,
              TWO: 2,
              THREE: 3,
              FOUR: 4,
              FIVE: 5,
            };

            const rating: number = starRatingMap[review.starRating] || 0;
            // Create a new review
            await prisma.review.create({
              data: {
                locationId: location.id,
                reviewId: review.reviewId,
                authorName: review.reviewer.displayName,
                authorPhoto: review.reviewer.profilePhotoUrl,
                rating: rating,
                comment: review.comment,
                createTime: new Date(review.createTime),
                updateTime: new Date(review.updateTime),
                isProcessed: false,
                language: review.reviewReply?.language || "en",
              },
            });

            results.push({
              locationId: location.id,
              reviewId: review.reviewId,
              action: "created",
            });
          } else if (new Date(review.updateTime) > existingReview.updateTime) {
            // Update existing review if it's been updated
            await prisma.review.update({
              where: { id: existingReview.id },
              data: {
                rating: review.starRating,
                comment: review.comment,
                updateTime: new Date(review.updateTime),
              },
            });

            results.push({
              locationId: location.id,
              reviewId: review.reviewId,
              action: "updated",
            });
          }
        }
      } catch (error) {
        console.error(`Error processing location ${location.id}:`, error);
        results.push({
          locationId: location.id,
          action: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedLocations: locations.length,
      results,
    });
  } catch (error) {
    console.error("Failed to sync reviews:", error);
    return NextResponse.json(
      { error: "Failed to sync reviews" },
      { status: 500 }
    );
  }
}
