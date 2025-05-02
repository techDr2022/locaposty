import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fetchSearchKeywordsData } from "../google-service";
import { refreshLocationToken } from "@/lib/refreshLocationToken";

// Define the GoogleMetricType type to match what's used in the Google API
type GoogleMetricType =
  | "WEBSITE_CLICKS"
  | "CALL_CLICKS"
  | "BUSINESS_BOOKINGS"
  | "BUSINESS_DIRECTION_REQUESTS"
  | "BUSINESS_IMPRESSIONS_MOBILE_MAPS"
  | "BUSINESS_IMPRESSIONS_MOBILE_SEARCH"
  | "BUSINESS_IMPRESSIONS_DESKTOP_MAPS"
  | "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"
  | "BUSINESS_CONVERSATIONS"
  | "BUSINESS_FOOD_ORDERS"
  | "BUSINESS_FOOD_MENU_CLICKS";

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

// Define a function to fetch Google performance data without storing in database
async function fetchGooglePerformanceData(
  location: {
    gmbLocationId: string;
    accessToken: string;
  },
  startDate: Date,
  endDate: Date
) {
  try {
    // Format dates for the API request
    const startDateObj = {
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1, // JavaScript months are 0-indexed
      day: startDate.getDate(),
    };

    const endDateObj = {
      year: endDate.getFullYear(),
      month: endDate.getMonth() + 1,
      day: endDate.getDate(),
    };

    // Define the metrics to fetch
    const metrics: GoogleMetricType[] = [
      "WEBSITE_CLICKS",
      "CALL_CLICKS",
      "BUSINESS_BOOKINGS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_CONVERSATIONS",
      "BUSINESS_FOOD_ORDERS",
      "BUSINESS_FOOD_MENU_CLICKS",
    ];

    // Construct the URL with query parameters
    let apiUrl = `https://businessprofileperformance.googleapis.com/v1/locations/${location.gmbLocationId}:fetchMultiDailyMetricsTimeSeries`;

    // Add metrics parameters
    metrics.forEach((metric) => {
      apiUrl += `&dailyMetrics=${encodeURIComponent(metric)}`;
    });

    // Add date range parameters
    apiUrl += `&dailyRange.start_date.year=${startDateObj.year}&dailyRange.start_date.month=${startDateObj.month}&dailyRange.start_date.day=${startDateObj.day}`;
    apiUrl += `&dailyRange.end_date.year=${endDateObj.year}&dailyRange.end_date.month=${endDateObj.month}&dailyRange.end_date.day=${endDateObj.day}`;

    // Fix URL format: replace first & with ?
    apiUrl = apiUrl.replace("&", "?");

    // Make the API request
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${location.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `API call failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    // Process the API response to format the metrics
    const processedMetrics: Array<{
      date: Date;
      views: number;
      websiteClicks: number;
      callClicks: number;
      directionRequests: number;
      bookings: number;
      foodOrders: number;
      foodMenuClicks: number;
      conversations: number;
      mobileMapViews: number;
      mobileSearchViews: number;
      desktopMapViews: number;
      desktopSearchViews: number;
    }> = [];

    // Create a map to track metrics by date
    const metricsByDate = new Map<
      string,
      {
        date: Date;
        views: number;
        websiteClicks: number;
        callClicks: number;
        directionRequests: number;
        bookings: number;
        foodOrders: number;
        foodMenuClicks: number;
        conversations: number;
        mobileMapViews: number;
        mobileSearchViews: number;
        desktopMapViews: number;
        desktopSearchViews: number;
      }
    >();

    if (data && data.multiDailyMetricTimeSeries) {
      // Process each metric time series
      for (const metricSeries of data.multiDailyMetricTimeSeries) {
        if (metricSeries.dailyMetricTimeSeries) {
          for (const dailyMetric of metricSeries.dailyMetricTimeSeries) {
            const metricType = dailyMetric.dailyMetric as GoogleMetricType;

            // Process the time series data
            if (dailyMetric.timeSeries && dailyMetric.timeSeries.datedValues) {
              for (const dataPoint of dailyMetric.timeSeries.datedValues) {
                if (dataPoint.date) {
                  // Construct date from the API response date object
                  const metricDate = new Date(
                    dataPoint.date.year,
                    dataPoint.date.month - 1, // JavaScript months are 0-indexed
                    dataPoint.date.day
                  );

                  const dateKey = metricDate.toISOString().split("T")[0];

                  // The value might be in a different field or format than we expected
                  // Try to find the metric value in the dataPoint
                  const metricValue =
                    dataPoint.value !== undefined
                      ? parseInt(dataPoint.value, 10)
                      : dataPoint.metric !== undefined
                        ? parseInt(dataPoint.metric, 10)
                        : 0;

                  // Initialize the date's metrics if it doesn't exist
                  if (!metricsByDate.has(dateKey)) {
                    metricsByDate.set(dateKey, {
                      date: metricDate,
                      views: 0,
                      websiteClicks: 0,
                      callClicks: 0,
                      directionRequests: 0,
                      bookings: 0,
                      foodOrders: 0,
                      foodMenuClicks: 0,
                      conversations: 0,
                      mobileMapViews: 0,
                      mobileSearchViews: 0,
                      desktopMapViews: 0,
                      desktopSearchViews: 0,
                    });
                  }

                  const dateMetrics = metricsByDate.get(dateKey)!;

                  // Map metric types to our metrics object
                  switch (metricType) {
                    case "WEBSITE_CLICKS":
                      dateMetrics.websiteClicks = metricValue;
                      break;
                    case "CALL_CLICKS":
                      dateMetrics.callClicks = metricValue;
                      break;
                    case "BUSINESS_BOOKINGS":
                      dateMetrics.bookings = metricValue;
                      break;
                    case "BUSINESS_DIRECTION_REQUESTS":
                      dateMetrics.directionRequests = metricValue;
                      break;
                    case "BUSINESS_IMPRESSIONS_MOBILE_MAPS":
                      dateMetrics.mobileMapViews = metricValue;
                      break;
                    case "BUSINESS_IMPRESSIONS_MOBILE_SEARCH":
                      dateMetrics.mobileSearchViews = metricValue;
                      break;
                    case "BUSINESS_IMPRESSIONS_DESKTOP_MAPS":
                      dateMetrics.desktopMapViews = metricValue;
                      break;
                    case "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH":
                      dateMetrics.desktopSearchViews = metricValue;
                      break;
                    case "BUSINESS_CONVERSATIONS":
                      dateMetrics.conversations = metricValue;
                      break;
                    case "BUSINESS_FOOD_ORDERS":
                      dateMetrics.foodOrders = metricValue;
                      break;
                    case "BUSINESS_FOOD_MENU_CLICKS":
                      dateMetrics.foodMenuClicks = metricValue;
                      break;
                  }
                }
              }
            }
          }
        }
      }

      // Calculate total views for each date and convert the map to an array
      for (const [, metrics] of metricsByDate) {
        // Total views is the sum of all impression metrics
        metrics.views =
          metrics.mobileMapViews +
          metrics.mobileSearchViews +
          metrics.desktopMapViews +
          metrics.desktopSearchViews;

        processedMetrics.push(metrics);
      }
    }

    return {
      metrics: processedMetrics,
    };
  } catch (error) {
    console.error("Error fetching Google performance data:", error);
    return null;
  }
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

    // Directly fetch performance data without storing in database
    const performanceDataPromises = locations.map(async (location) => {
      const token = await refreshLocationToken(location.id);
      return fetchGooglePerformanceData(
        {
          gmbLocationId: location.gmbLocationId,
          accessToken: token,
        },
        startDate,
        endDate
      );
    });

    const performanceResults = await Promise.all(performanceDataPromises);
    const performanceData = processPerformanceData(
      performanceResults,
      startDate,
      endDate
    );

    // Fetch review data for each location
    const reviewData = await getReviewData(startDate, endDate, locations);

    // Fetch search keywords data for each location
    const searchKeywordsData = await Promise.all(
      locations.map(async (location) => {
        const token = await refreshLocationToken(location.id);
        const keywordsData = await fetchSearchKeywordsData(
          {
            gmbLocationId: location.gmbLocationId,
            accessToken: token,
          },
          startDate,
          endDate
        );
        return keywordsData;
      })
    );

    // Process search keywords data to get top 10 keywords
    const topKeywords = searchKeywordsData
      .flatMap((data) => data?.searchKeywordsCounts || [])
      .sort((a, b) => {
        const aValue = parseInt(a.insightsValue.value || "0");
        const bValue = parseInt(b.insightsValue.value || "0");
        return bValue - aValue;
      })
      .slice(0, 10)
      .map((keyword) => ({
        keyword: keyword.searchKeyword,
        impressions: parseInt(
          keyword.insightsValue.value || keyword.insightsValue.threshold || "0"
        ),
      }));

    return NextResponse.json({
      success: true,
      data: {
        performance: performanceData,
        reviews: reviewData,
        searchKeywords: topKeywords,
      },
    });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

// Function to process performance data directly from API responses
function processPerformanceData(
  performanceResults: Array<{
    metrics?: Array<{
      date: Date;
      views: number;
      websiteClicks: number;
      callClicks: number;
      directionRequests: number;
      bookings: number;
      foodOrders: number;
      foodMenuClicks: number;
      conversations: number;
      mobileMapViews: number;
      mobileSearchViews: number;
      desktopMapViews: number;
      desktopSearchViews: number;
    }>;
  } | null>,
  startDate: Date,
  endDate: Date
) {
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const data = [];

  try {
    // Create a map to aggregate metrics by date across all locations
    const metricsMap = new Map();

    // Process each location's performance data
    performanceResults.forEach((locationData) => {
      if (!locationData || !locationData.metrics) return;

      locationData.metrics.forEach((metric) => {
        const metricDate = metric.date;
        const dateKey = metricDate.toISOString().split("T")[0];

        if (!metricsMap.has(dateKey)) {
          metricsMap.set(dateKey, {
            views: 0,
            clicks: 0,
            calls: 0,
            directions: 0,
            bookings: 0,
            foodOrders: 0,
            foodMenuClicks: 0,
            conversations: 0,
            mobileMapViews: 0,
            mobileSearchViews: 0,
            desktopMapViews: 0,
            desktopSearchViews: 0,
          });
        }

        const dateMetrics = metricsMap.get(dateKey);

        // Aggregate the metrics
        dateMetrics.views += metric.views || 0;
        dateMetrics.clicks += metric.websiteClicks || 0;
        dateMetrics.calls += metric.callClicks || 0;
        dateMetrics.directions += metric.directionRequests || 0;
        dateMetrics.bookings += metric.bookings || 0;
        dateMetrics.foodOrders += metric.foodOrders || 0;
        dateMetrics.foodMenuClicks += metric.foodMenuClicks || 0;
        dateMetrics.conversations += metric.conversations || 0;
        dateMetrics.mobileMapViews += metric.mobileMapViews || 0;
        dateMetrics.mobileSearchViews += metric.mobileSearchViews || 0;
        dateMetrics.desktopMapViews += metric.desktopMapViews || 0;
        dateMetrics.desktopSearchViews += metric.desktopSearchViews || 0;
      });
    });

    // Generate daily data points from the aggregated metrics
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split("T")[0];
      const formattedDate = format(currentDate, "MMM dd, yyyy");

      // Check if we have metrics for this date
      const dateMetrics = metricsMap.get(dateKey);

      if (dateMetrics) {
        data.push({
          date: formattedDate,
          ...dateMetrics,
        });
      } else {
        // If no metrics for this date, add a zero-value point to maintain continuity
        data.push({
          date: formattedDate,
          views: 0,
          clicks: 0,
          calls: 0,
          directions: 0,
          bookings: 0,
          foodOrders: 0,
          foodMenuClicks: 0,
          conversations: 0,
          mobileMapViews: 0,
          mobileSearchViews: 0,
          desktopMapViews: 0,
          desktopSearchViews: 0,
        });
      }
    }

    return data;
  } catch (error) {
    console.error("Error processing performance data:", error);
    throw error;
  }
}

// Function to retrieve review data
async function getReviewData(
  startDate: Date,
  endDate: Date,
  locations: Array<{
    id: string;
    gmbAccountId: string;
    gmbLocationId: string;
  }>
) {
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
  const totalRating = filteredReviews.reduce((sum: number, review: Review) => {
    const ratingMap = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
    };
    return sum + ratingMap[review.starRating];
  }, 0);
  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  // Count reviews by rating
  const ratingDistribution = {
    oneStar: filteredReviews.filter((review) => review.starRating === "ONE")
      .length,
    twoStar: filteredReviews.filter((review) => review.starRating === "TWO")
      .length,
    threeStar: filteredReviews.filter((review) => review.starRating === "THREE")
      .length,
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

  return {
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
  };
}
