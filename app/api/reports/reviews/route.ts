import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshLocationToken } from "@/lib/refreshLocationToken";

interface Review {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");
    const locationId = searchParams.get("locationId");

    // Validate date parameters
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = endDateParam ? new Date(endDateParam) : new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date parameters" },
        { status: 400 }
      );
    }

    // Get user's locations
    let locations: Array<{
      id: string;
      gmbAccountId: string;
      gmbLocationId: string;
    }> = [];

    if (locationId) {
      // Get specific location if locationId is provided
      const location = await prisma.location.findFirst({
        where: {
          id: locationId,
          users: {
            some: {
              id: session.user.id,
            },
          },
        },
        select: {
          id: true,
          gmbAccountId: true,
          gmbLocationId: true,
        },
      });

      if (!location?.gmbAccountId || !location?.gmbLocationId) {
        return NextResponse.json(
          { success: false, error: "Location not found or not authorized" },
          { status: 404 }
        );
      }

      locations = [
        {
          id: location.id,
          gmbAccountId: location.gmbAccountId,
          gmbLocationId: location.gmbLocationId,
        },
      ];
    } else {
      // Get all user's locations
      const allLocations = await prisma.location.findMany({
        where: {
          users: {
            some: {
              id: session.user.id,
            },
          },
        },
        select: {
          id: true,
          gmbAccountId: true,
          gmbLocationId: true,
        },
      });

      // Filter out any locations with null values
      locations = allLocations
        .filter((loc) => loc.gmbAccountId && loc.gmbLocationId)
        .map((loc) => ({
          id: loc.id,
          gmbAccountId: loc.gmbAccountId!,
          gmbLocationId: loc.gmbLocationId!,
        }));
    }

    if (locations.length === 0) {
      return NextResponse.json(
        { success: false, error: "No locations found" },
        { status: 404 }
      );
    }

    // Fetch reviews from Google My Business API
    const allReviews: Review[] = [];
    for (const location of locations) {
      const token = await refreshLocationToken(location.id);
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
      allReviews.push(...reviews);
    }

    // Filter reviews based on date range
    const filteredReviews = allReviews.filter((review) => {
      const reviewDate = new Date(review.createTime);
      return reviewDate >= startDate && reviewDate <= endDate;
    });

    // Calculate metrics
    const totalReviews = filteredReviews.length;

    // Calculate average rating
    const totalRating = filteredReviews.reduce(
      (sum: number, review: Review) => {
        const ratingMap = {
          ONE: 1,
          TWO: 2,
          THREE: 3,
          FOUR: 4,
          FIVE: 5,
        };
        return sum + ratingMap[review.starRating];
      },
      0
    );
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Count reviews by rating
    const ratingDistribution = {
      oneStar: filteredReviews.filter((review) => review.starRating === "ONE")
        .length,
      twoStar: filteredReviews.filter((review) => review.starRating === "TWO")
        .length,
      threeStar: filteredReviews.filter(
        (review) => review.starRating === "THREE"
      ).length,
      fourStar: filteredReviews.filter((review) => review.starRating === "FOUR")
        .length,
      fiveStar: filteredReviews.filter((review) => review.starRating === "FIVE")
        .length,
    };

    // Calculate reply rate
    const repliedReviews = filteredReviews.filter(
      (review) => review.reviewReply
    ).length;
    const replyRate =
      totalReviews > 0 ? (repliedReviews / totalReviews) * 100 : 0;

    // Calculate average reply response time
    let totalResponseTime = 0;
    let repliedReviewsCount = 0;

    filteredReviews.forEach((review: Review) => {
      if (review.reviewReply) {
        const responseTime =
          new Date(review.reviewReply.updateTime).getTime() -
          new Date(review.createTime).getTime();
        totalResponseTime += responseTime;
        repliedReviewsCount++;
      }
    });

    const averageReplyResponseTime =
      repliedReviewsCount > 0 ? totalResponseTime / repliedReviewsCount : 0;

    // Group reviews by date for time series data
    const reviewsByDate = new Map<
      string,
      {
        date: string;
        total: number;
        positive: number;
        negative: number;
        neutral: number;
        replied: number;
      }
    >();

    filteredReviews.forEach((review: Review) => {
      const date = new Date(review.createTime).toISOString().split("T")[0];
      if (!reviewsByDate.has(date)) {
        reviewsByDate.set(date, {
          date,
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          replied: 0,
        });
      }

      const dateData = reviewsByDate.get(date)!;
      dateData.total++;

      // Categorize by rating
      if (review.starRating === "FOUR" || review.starRating === "FIVE") {
        dateData.positive++;
      } else if (review.starRating === "ONE" || review.starRating === "TWO") {
        dateData.negative++;
      } else {
        dateData.neutral++;
      }

      if (review.reviewReply) {
        dateData.replied++;
      }
    });

    // Convert to array and sort by date
    const timeSeriesData = Array.from(reviewsByDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(2)),
          ratingDistribution,
          replyRate: parseFloat(replyRate.toFixed(2)),
          averageReplyResponseTime: Math.round(
            averageReplyResponseTime / (1000 * 60 * 60)
          ),
        },
        timeSeries: timeSeriesData,
      },
    });
  } catch (error) {
    console.error("Error fetching review metrics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch review metrics" },
      { status: 500 }
    );
  }
}
