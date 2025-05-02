import { prisma } from "@/lib/prisma";
import { refreshLocationToken } from "@/lib/refreshLocationToken";
import { $Enums } from "@/lib/generated/prisma";

// Type for metric mapping
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

/**
 * Fetches performance data from Google Business Profile API for a location
 * and saves it to the database
 */
export async function fetchAndStoreGooglePerformanceData(
  locationId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  try {
    // Get the location from the database
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        gmbLocationId: true,
        accessToken: true,
        refreshToken: true,
        tokenExpiresAt: true,
      },
    });

    if (!location) {
      console.error(`Location with ID ${locationId} not found`);
      return false;
    }

    // Check if we need to refresh the token
    if (
      !location.accessToken ||
      !location.tokenExpiresAt ||
      location.tokenExpiresAt < new Date()
    ) {
      if (!location.refreshToken) {
        console.error(`Location with ID ${locationId} has no refresh token`);
        return false;
      }

      // Refresh the token
      try {
        const newAccessToken = await refreshLocationToken(locationId);
        location.accessToken = newAccessToken;
      } catch (error) {
        console.error(
          `Failed to refresh token for location ${locationId}`,
          error
        );
        return false;
      }
    }

    // First, try to fetch actual data from the Google Business Profile API
    try {
      const realDataFetched = await fetchRealGooglePerformanceData(
        location,
        locationId,
        startDate,
        endDate
      );
      console.log("realDataFetched", realDataFetched);

      if (realDataFetched) {
        // Update the lastFetchedTimestamp for the location
        await prisma.location.update({
          where: { id: locationId },
          data: { lastFetchedTimestamp: new Date() },
        });

        console.log(
          "Successfully fetched real performance data from Google API"
        );
        return true;
      }
    } catch (error) {
      console.error("Error fetching data from Google API:", error);
      // Continue to fallback method if real API fails
    }
    return false;
  } catch (error) {
    console.error(`Error fetching and storing Google performance data:`, error);
    return false;
  }
}

/**
 * Fetches actual performance data from Google Business Profile API
 */
async function fetchRealGooglePerformanceData(
  location: {
    gmbLocationId: string;
    accessToken: string | null;
  },
  locationId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  if (!location.accessToken) {
    console.error("No access token available");
    return false;
  }

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

    console.log(`Fetching from API: ${apiUrl}`);

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
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log(
      "API response received:",
      JSON.stringify(data).substring(0, 200) + "..."
    );
    console.log("Full data structure:", JSON.stringify(data, null, 2));

    // Process the API response
    const insightsToCreate = [];

    if (data && data.multiDailyMetricTimeSeries) {
      // Map the API metrics to our InsightType enum
      const metricMappings: Record<GoogleMetricType, $Enums.InsightType> = {
        WEBSITE_CLICKS: $Enums.InsightType.WEBSITE_CLICKS,
        CALL_CLICKS: $Enums.InsightType.CALL_CLICKS,
        BUSINESS_BOOKINGS: $Enums.InsightType.BUSINESS_BOOKINGS,
        BUSINESS_DIRECTION_REQUESTS: $Enums.InsightType.DIRECTION_REQUESTS,
        BUSINESS_IMPRESSIONS_MOBILE_MAPS:
          $Enums.InsightType.BUSINESS_IMPRESSIONS_MOBILE_MAPS,
        BUSINESS_IMPRESSIONS_MOBILE_SEARCH:
          $Enums.InsightType.BUSINESS_IMPRESSIONS_MOBILE_SEARCH,
        BUSINESS_IMPRESSIONS_DESKTOP_MAPS:
          $Enums.InsightType.BUSINESS_IMPRESSIONS_DESKTOP_MAPS,
        BUSINESS_IMPRESSIONS_DESKTOP_SEARCH:
          $Enums.InsightType.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH,
        BUSINESS_CONVERSATIONS: $Enums.InsightType.BUSINESS_CONVERSATIONS,
        BUSINESS_FOOD_ORDERS: $Enums.InsightType.BUSINESS_FOOD_ORDERS,
        BUSINESS_FOOD_MENU_CLICKS: $Enums.InsightType.BUSINESS_FOOD_MENU_CLICKS,
      };

      // Process each metric time series
      for (const metricSeries of data.multiDailyMetricTimeSeries) {
        // Based on the API response, we need to adjust how we access the data
        if (metricSeries.dailyMetricTimeSeries) {
          for (const dailyMetric of metricSeries.dailyMetricTimeSeries) {
            const metricType = dailyMetric.dailyMetric as GoogleMetricType;
            const insightType = metricMappings[metricType];

            if (!insightType) {
              console.warn(`Unknown metric type: ${metricType}`);
              continue;
            }

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

                  // The value might be in a different field or format than we expected
                  // Try to find the metric value in the dataPoint
                  const metricValue =
                    dataPoint.value !== undefined
                      ? parseInt(dataPoint.value, 10)
                      : dataPoint.metric !== undefined
                        ? parseInt(dataPoint.metric, 10)
                        : 0;

                  console.log(
                    `Processing metric: ${metricType}, date: ${metricDate.toISOString()}, value: ${metricValue}`
                  );

                  insightsToCreate.push({
                    locationId,
                    date: metricDate,
                    type: insightType,
                    value: metricValue || 0,
                    createdAt: new Date(),
                  });
                }
              }
            }
          }
        }
      }

      // Additional processing for derived metrics (VIEWS = sum of all impressions)
      // Group metrics by date to calculate daily totals
      const dateMap = new Map<
        string,
        {
          mobileMapViews: number;
          mobileSearchViews: number;
          desktopMapViews: number;
          desktopSearchViews: number;
        }
      >();

      for (const insight of insightsToCreate) {
        const dateKey = insight.date.toISOString().split("T")[0];

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            mobileMapViews: 0,
            mobileSearchViews: 0,
            desktopMapViews: 0,
            desktopSearchViews: 0,
          });
        }

        const dateData = dateMap.get(dateKey)!;

        // Update metrics for this date
        if (
          insight.type === $Enums.InsightType.BUSINESS_IMPRESSIONS_MOBILE_MAPS
        ) {
          dateData.mobileMapViews = insight.value;
        } else if (
          insight.type === $Enums.InsightType.BUSINESS_IMPRESSIONS_MOBILE_SEARCH
        ) {
          dateData.mobileSearchViews = insight.value;
        } else if (
          insight.type === $Enums.InsightType.BUSINESS_IMPRESSIONS_DESKTOP_MAPS
        ) {
          dateData.desktopMapViews = insight.value;
        } else if (
          insight.type ===
          $Enums.InsightType.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH
        ) {
          dateData.desktopSearchViews = insight.value;
        }
      }

      // Add VIEWS insights (sum of all impressions)
      for (const [dateKey, metrics] of dateMap.entries()) {
        const dateParts = dateKey.split("-").map((part) => parseInt(part, 10));
        const metricDate = new Date(
          dateParts[0],
          dateParts[1] - 1,
          dateParts[2]
        );

        const totalViews =
          metrics.mobileMapViews +
          metrics.mobileSearchViews +
          metrics.desktopMapViews +
          metrics.desktopSearchViews;

        console.log(
          `Creating VIEWS metric for ${dateKey} with total ${totalViews}`
        );

        insightsToCreate.push({
          locationId,
          date: metricDate,
          type: $Enums.InsightType.VIEWS,
          value: totalViews,
          createdAt: new Date(),
        });
      }
    }

    // Store insights in the database
    if (insightsToCreate.length > 0) {
      console.log(
        `Storing ${insightsToCreate.length} insights from Google API`
      );

      await prisma.insight.createMany({
        data: insightsToCreate,
        skipDuplicates: true,
      });

      return true;
    } else {
      console.warn("No insights data to store from API response");
    }

    return false;
  } catch (error) {
    console.error("Error fetching real Google performance data:", error);
    return false;
  }
}

/**
 * Fetches search keywords data from Google Business Profile API
 */
export async function fetchSearchKeywordsData(
  location: {
    gmbLocationId: string;
    accessToken: string | null;
  },
  startDate: Date,
  endDate: Date
): Promise<any> {
  if (!location.accessToken) {
    console.error("No access token available");
    return null;
  }

  try {
    // Format dates for the API request
    const startDateObj = {
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
    };

    const endDateObj = {
      year: endDate.getFullYear(),
      month: endDate.getMonth() + 1,
    };

    // Construct the URL with query parameters
    const apiUrl = `https://businessprofileperformance.googleapis.com/v1/locations/${location.gmbLocationId}/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${startDateObj.year}&monthlyRange.start_month.month=${startDateObj.month}&monthlyRange.end_month.year=${endDateObj.year}&monthlyRange.end_month.month=${endDateObj.month}`;

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
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching search keywords data:", error);
    return null;
  }
}

/**
 * Schedules a job to fetch and store performance data for all locations
 */
export async function scheduleFetchPerformanceData(): Promise<void> {
  const locations = await prisma.location.findMany({
    where: {
      isVerified: true,
      refreshToken: { not: null },
    },
    select: {
      id: true,
    },
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30); // Fetch last 30 days

  for (const location of locations) {
    await fetchAndStoreGooglePerformanceData(location.id, startDate, endDate);
  }
}
