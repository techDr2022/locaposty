import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import puppeteer from "puppeteer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

// Define types for request data
interface PerformanceDataItem {
  date: string;
  views: number;
  clicks: number;
  calls: number;
  directions: number;
  mobileMapViews?: number;
  mobileSearchViews?: number;
  desktopMapViews?: number;
  desktopSearchViews?: number;
  [key: string]: number | string | undefined;
}

interface ReviewData {
  summary: {
    totalReviews: number;
    averageRating: number;
    replyRate: number;
    averageReplyResponseTime: number;
    ratingDistribution: {
      oneStar: number;
      twoStar: number;
      threeStar: number;
      fourStar: number;
      fiveStar: number;
    };
  };
}

interface SearchKeyword {
  keyword: string;
  impressions: number;
}

interface RequestData {
  performanceData: PerformanceDataItem[];
  reviewData: ReviewData;
  searchKeywords: SearchKeyword[];
  locationId: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request data
    const requestData: RequestData = await request.json();
    const {
      performanceData,
      reviewData,
      searchKeywords,
      dateRange,
      locationId,
    } = requestData;

    // Fetch the location details from the database
    let locationName = "";
    let locationAddress = "";

    console.log(locationId);

    try {
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
          name: true,
          gmbLocationName: true,
          address: true,
        },
      });

      if (location) {
        locationName = location.gmbLocationName || location.name;
        locationAddress = location.address || "";
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
      // Continue with report generation even if location fetch fails
    }

    // Format dates
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const formattedStartDate = format(startDate, "MMM dd, yyyy");
    const formattedEndDate = format(endDate, "MMM dd, yyyy");

    // Calculate summary metrics
    const totalViews = performanceData.reduce(
      (sum: number, item: PerformanceDataItem) => sum + item.views,
      0
    );
    const totalClicks = performanceData.reduce(
      (sum: number, item: PerformanceDataItem) => sum + item.clicks,
      0
    );
    const totalCalls = performanceData.reduce(
      (sum: number, item: PerformanceDataItem) => sum + item.calls,
      0
    );
    const totalDirections = performanceData.reduce(
      (sum: number, item: PerformanceDataItem) => sum + item.directions,
      0
    );

    // Calculate device breakdown if available
    let mobileViews = 0;
    let desktopViews = 0;
    let searchViews = 0;
    let mapsViews = 0;

    performanceData.forEach((item: PerformanceDataItem) => {
      const mobileMapViews = Number(item.mobileMapViews || 0);
      const mobileSearchViews = Number(item.mobileSearchViews || 0);
      const desktopMapViews = Number(item.desktopMapViews || 0);
      const desktopSearchViews = Number(item.desktopSearchViews || 0);

      mobileViews += mobileMapViews + mobileSearchViews;
      desktopViews += desktopMapViews + desktopSearchViews;
      searchViews += mobileSearchViews + desktopSearchViews;
      mapsViews += mobileMapViews + desktopMapViews;
    });

    // Generate HTML template
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Performance Report</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            color: #333;
          }
          h1, h2, h3 {
            margin-top: 0;
            font-weight: 600;
          }
          .report-header {
            margin-bottom: 2rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-container {
            text-align: right;
          }
          .date-range {
            font-size: 1rem;
            color: #6b7280;
            margin-bottom: 1rem;
          }
          .location-name {
            font-size: 1rem;
            color: #6b7280;
            margin-bottom: 1rem;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
          }
          @media (min-width: 768px) {
            .metrics-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .metric-card {
            background-color: #f9fafb;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .metric-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 0.5rem;
          }
          .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
          }
          .section {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .page-break {
            page-break-before: always;
          }
          .section-title {
            font-size: 1.25rem;
            margin-bottom: 1rem;
            color: #1E56A0;
          }
          .chart-container {
            background-color: #f9fafb;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 1.5rem;
            height: 300px;
            position: relative;
          }
          .grid-cols-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }
          .donut-chart {
            height: 200px;
            width: 200px;
            margin: 0 auto;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
          }
          .table th, .table td {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .table th {
            background-color: #f9fafb;
            font-weight: 600;
          }
          .keywords-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          .keyword-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 1rem;
            background-color: #f9fafb;
            border-radius: 0.375rem;
            border: 1px solid #e5e7eb;
          }
          .keyword-rank {
            color: #6b7280;
            margin-right: 0.5rem;
          }
          .footer {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.875rem;
            color: #6b7280;
          }
          .bar-container {
            width: 100%;
            background-color: #f3f4f6;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          .bar {
            height: 24px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            padding: 0 8px;
            color: white;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .star-label {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            margin-bottom: 4px;
          }
          .star-count {
            margin-left: auto;
            color: #6b7280;
          }
          .css-chart {
            margin-top: 1rem;
          }
          .css-chart-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .css-bar-chart {
            display: flex;
            flex-direction: column;
            width: 100%;
            padding: 1rem 0;
          }
          .css-bar-row {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
          }
          .css-bar-label {
            width: 60px;
            font-size: 0.75rem;
            text-align: right;
            padding-right: 0.5rem;
            color: #6b7280;
          }
          .css-bar-container {
            flex-grow: 1;
            background-color: #f3f4f6;
            border-radius: 4px;
            height: 12px;
            overflow: hidden;
          }
          .css-bar {
            height: 100%;
            border-radius: 4px;
          }
          .css-bar-value {
            width: 40px;
            font-size: 0.75rem;
            padding-left: 0.5rem;
          }
          .css-donut-chart {
            position: relative;
            width: 150px;
            height: 150px;
            margin: 0 auto;
            border-radius: 50%;
            background: conic-gradient(
              #1E56A0 0% ${(mobileViews / (mobileViews + desktopViews)) * 100}%, 
              #F76E11 ${(mobileViews / (mobileViews + desktopViews)) * 100}% 100%
            );
          }
          .css-donut-hole {
            position: absolute;
            width: 100px;
            height: 100px;
            top: 25px;
            left: 25px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            color: #6b7280;
          }
          .css-legend {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
          }
          .css-legend-item {
            display: flex;
            align-items: center;
            font-size: 0.75rem;
          }
          .css-legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            margin-right: 4px;
          }
          .css-map-donut-chart {
            position: relative;
            width: 150px;
            height: 150px;
            margin: 0 auto;
            border-radius: 50%;
            background: conic-gradient(
              #66BB6A 0% ${(searchViews / (searchViews + mapsViews)) * 100}%, 
              #9C27B0 ${(searchViews / (searchViews + mapsViews)) * 100}% 100%
            );
          }
        </style>
      </head>
      <body>
        <div class="section">
          <div class="report-header">
            <div>
              <h1>Performance Report</h1>
              <div class="date-range">
                ${formattedStartDate} - ${formattedEndDate}
              </div>
              ${locationName ? `<div class="location-name">${locationName}${locationAddress ? ` • ${locationAddress}` : ""}</div>` : ""}
            </div>
          </div>

          <h2 class="section-title">Overview</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Total Views</div>
              <div class="metric-value">${totalViews.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Website Clicks</div>
              <div class="metric-value">${totalClicks.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Direction Requests</div>
              <div class="metric-value">${totalDirections.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Phone Calls</div>
              <div class="metric-value">${totalCalls.toLocaleString()}</div>
            </div>
          </div>
        </div>

        ${
          (mobileViews > 0 || desktopViews > 0) && reviewData
            ? `
        <div class="section page-break">
          <div class="grid-cols-2" style="margin-bottom: 2rem;">
            <div>
              <h2 class="section-title">Device & Platform Breakdown</h2>
              <div>
                <h3 style="font-size: 1rem; text-align: center;">Mobile vs Desktop</h3>
                <div class="css-donut-chart">
                  <div class="css-donut-hole">Device Breakdown</div>
                </div>
                <div class="css-legend">
                  <div class="css-legend-item">
                    <div class="css-legend-color" style="background-color: #1E56A0;"></div>
                    <span>Mobile (${Math.round((mobileViews / (mobileViews + desktopViews)) * 100)}%)</span>
                  </div>
                  <div class="css-legend-item">
                    <div class="css-legend-color" style="background-color: #F76E11;"></div>
                    <span>Desktop (${Math.round((desktopViews / (mobileViews + desktopViews)) * 100)}%)</span>
                  </div>
                </div>
              </div>
              <div style="margin-top: 2rem;">
                <h3 style="font-size: 1rem; text-align: center;">Search vs Maps</h3>
                <div class="css-map-donut-chart">
                  <div class="css-donut-hole">Platform Breakdown</div>
                </div>
                <div class="css-legend">
                  <div class="css-legend-item">
                    <div class="css-legend-color" style="background-color: #66BB6A;"></div>
                    <span>Search (${Math.round((searchViews / (searchViews + mapsViews)) * 100)}%)</span>
                  </div>
                  <div class="css-legend-item">
                    <div class="css-legend-color" style="background-color: #9C27B0;"></div>
                    <span>Maps (${Math.round((mapsViews / (searchViews + mapsViews)) * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 class="section-title">Reviews Summary</h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                <div class="metric-card">
                  <div class="metric-title">Total Reviews</div>
                  <div class="metric-value">${reviewData.summary.totalReviews.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-title">Average Rating</div>
                  <div class="metric-value">${reviewData.summary.averageRating.toFixed(1)}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-title">Reply Rate</div>
                  <div class="metric-value">${reviewData.summary.replyRate.toFixed(1)}%</div>
                </div>
                <div class="metric-card">
                  <div class="metric-title">Avg. Response Time</div>
                  <div class="metric-value">${reviewData.summary.averageReplyResponseTime}h</div>
                </div>
              </div>
              
              <h3 style="font-size: 1rem; margin-bottom: 1rem;">Rating Distribution</h3>
              <div class="css-chart-container">
                <div class="star-label">
                  <span>★★★★★</span>
                  <span class="star-count">${reviewData.summary.ratingDistribution.fiveStar}</span>
                </div>
                <div class="bar-container">
                  <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.fiveStar / reviewData.summary.totalReviews) * 100}%; background-color: #66BB6A;">
                    ${Math.round((reviewData.summary.ratingDistribution.fiveStar / reviewData.summary.totalReviews) * 100)}%
                  </div>
                </div>
                
                <div class="star-label">
                  <span>★★★★☆</span>
                  <span class="star-count">${reviewData.summary.ratingDistribution.fourStar}</span>
                </div>
                <div class="bar-container">
                  <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.fourStar / reviewData.summary.totalReviews) * 100}%; background-color: #42A5F5;">
                    ${Math.round((reviewData.summary.ratingDistribution.fourStar / reviewData.summary.totalReviews) * 100)}%
                  </div>
                </div>
                
                <div class="star-label">
                  <span>★★★☆☆</span>
                  <span class="star-count">${reviewData.summary.ratingDistribution.threeStar}</span>
                </div>
                <div class="bar-container">
                  <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.threeStar / reviewData.summary.totalReviews) * 100}%; background-color: #FFD600;">
                    ${Math.round((reviewData.summary.ratingDistribution.threeStar / reviewData.summary.totalReviews) * 100)}%
                  </div>
                </div>
                
                <div class="star-label">
                  <span>★★☆☆☆</span>
                  <span class="star-count">${reviewData.summary.ratingDistribution.twoStar}</span>
                </div>
                <div class="bar-container">
                  <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.twoStar / reviewData.summary.totalReviews) * 100}%; background-color: #FFA726;">
                    ${Math.round((reviewData.summary.ratingDistribution.twoStar / reviewData.summary.totalReviews) * 100)}%
                  </div>
                </div>
                
                <div class="star-label">
                  <span>★☆☆☆☆</span>
                  <span class="star-count">${reviewData.summary.ratingDistribution.oneStar}</span>
                </div>
                <div class="bar-container">
                  <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.oneStar / reviewData.summary.totalReviews) * 100}%; background-color: #FF4B4B;">
                    ${Math.round((reviewData.summary.ratingDistribution.oneStar / reviewData.summary.totalReviews) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        `
            : mobileViews > 0 || desktopViews > 0
              ? `
        <div class="section page-break">
          <h2 class="section-title">Device & Platform Breakdown</h2>
          <div class="grid-cols-2">
            <div>
              <h3 style="font-size: 1rem; text-align: center;">Mobile vs Desktop</h3>
              <div class="css-donut-chart">
                <div class="css-donut-hole">Device Breakdown</div>
              </div>
              <div class="css-legend">
                <div class="css-legend-item">
                  <div class="css-legend-color" style="background-color: #1E56A0;"></div>
                  <span>Mobile (${Math.round((mobileViews / (mobileViews + desktopViews)) * 100)}%)</span>
                </div>
                <div class="css-legend-item">
                  <div class="css-legend-color" style="background-color: #F76E11;"></div>
                  <span>Desktop (${Math.round((desktopViews / (mobileViews + desktopViews)) * 100)}%)</span>
                </div>
              </div>
            </div>
            <div>
              <h3 style="font-size: 1rem; text-align: center;">Search vs Maps</h3>
              <div class="css-map-donut-chart">
                <div class="css-donut-hole">Platform Breakdown</div>
              </div>
              <div class="css-legend">
                <div class="css-legend-item">
                  <div class="css-legend-color" style="background-color: #66BB6A;"></div>
                  <span>Search (${Math.round((searchViews / (searchViews + mapsViews)) * 100)}%)</span>
                </div>
                <div class="css-legend-item">
                  <div class="css-legend-color" style="background-color: #9C27B0;"></div>
                  <span>Maps (${Math.round((mapsViews / (searchViews + mapsViews)) * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        `
              : ""
        }

        ${
          reviewData && !(mobileViews > 0 || desktopViews > 0)
            ? `
        <div class="section page-break">
          <h2 class="section-title">Reviews</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Total Reviews</div>
              <div class="metric-value">${reviewData.summary.totalReviews.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Average Rating</div>
              <div class="metric-value">${reviewData.summary.averageRating.toFixed(1)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Reply Rate</div>
              <div class="metric-value">${reviewData.summary.replyRate.toFixed(1)}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Avg. Response Time</div>
              <div class="metric-value">${reviewData.summary.averageReplyResponseTime}h</div>
            </div>
          </div>
          
          <div class="chart-container">
            <h3 style="font-size: 1rem; margin-bottom: 1rem;">Rating Distribution</h3>
            <div class="css-chart-container">
              <div class="star-label">
                <span>★★★★★</span>
                <span class="star-count">${reviewData.summary.ratingDistribution.fiveStar}</span>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.fiveStar / reviewData.summary.totalReviews) * 100}%; background-color: #66BB6A;">
                  ${Math.round((reviewData.summary.ratingDistribution.fiveStar / reviewData.summary.totalReviews) * 100)}%
                </div>
              </div>
              
              <div class="star-label">
                <span>★★★★☆</span>
                <span class="star-count">${reviewData.summary.ratingDistribution.fourStar}</span>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.fourStar / reviewData.summary.totalReviews) * 100}%; background-color: #42A5F5;">
                  ${Math.round((reviewData.summary.ratingDistribution.fourStar / reviewData.summary.totalReviews) * 100)}%
                </div>
              </div>
              
              <div class="star-label">
                <span>★★★☆☆</span>
                <span class="star-count">${reviewData.summary.ratingDistribution.threeStar}</span>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.threeStar / reviewData.summary.totalReviews) * 100}%; background-color: #FFD600;">
                  ${Math.round((reviewData.summary.ratingDistribution.threeStar / reviewData.summary.totalReviews) * 100)}%
                </div>
              </div>
              
              <div class="star-label">
                <span>★★☆☆☆</span>
                <span class="star-count">${reviewData.summary.ratingDistribution.twoStar}</span>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.twoStar / reviewData.summary.totalReviews) * 100}%; background-color: #FFA726;">
                  ${Math.round((reviewData.summary.ratingDistribution.twoStar / reviewData.summary.totalReviews) * 100)}%
                </div>
              </div>
              
              <div class="star-label">
                <span>★☆☆☆☆</span>
                <span class="star-count">${reviewData.summary.ratingDistribution.oneStar}</span>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${(reviewData.summary.ratingDistribution.oneStar / reviewData.summary.totalReviews) * 100}%; background-color: #FF4B4B;">
                  ${Math.round((reviewData.summary.ratingDistribution.oneStar / reviewData.summary.totalReviews) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        `
            : ""
        }

        ${
          searchKeywords && searchKeywords.length > 0
            ? `
        <div class="section page-break">
          <h2 class="section-title">Top Search Keywords</h2>
          <div class="chart-container" style="height: auto; min-height: 200px;">
            <div class="css-chart-container">
              ${searchKeywords
                .slice(0, 10)
                .map((keyword: SearchKeyword, index: number) => {
                  const maxImpressions = Math.max(
                    ...searchKeywords.slice(0, 10).map((k) => k.impressions)
                  );
                  return `
                <div class="css-bar-row">
                  <div class="css-bar-label" style="width: 30px;">#${index + 1}</div>
                  <div style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">
                    ${keyword.keyword}
                  </div>
                  <div class="css-bar-container" style="flex-grow: 0; width: 40%;">
                    <div class="css-bar" style="width: ${(keyword.impressions / maxImpressions) * 100}%; background-color: #1E56A0;"></div>
                  </div>
                  <div class="css-bar-value" style="width: 60px;">${keyword.impressions.toLocaleString()}</div>
                </div>
              `;
                })
                .join("")}
            </div>
          </div>
        </div>
        `
            : ""
        }

        ${
          // Only include the phone calls section if we have calls data AND we haven't already included a similar section
          totalCalls > 0
            ? `
        <div class="section page-break">
          <h2 class="section-title">Monthly Phone Calls Comparison</h2>
          <p style="margin-top: 0; color: #6b7280; margin-bottom: 1rem;">Comparison of phone calls across different months</p>
          
          ${(() => {
            // Transform performance data into monthly data that matches the frontend
            const monthlyData: Record<string, number> = {};
            const monthOrder: string[] = [];
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];

            // Track the months we've already seen to avoid duplicates
            const seenMonths = new Set<string>();

            performanceData.forEach((item) => {
              try {
                // Extract date and get month/year
                const dateParts = item.date.split(",");
                const monthAbbr = dateParts[0].substring(0, 3); // "Jan", "Feb", etc.
                const year = parseInt(
                  dateParts[1].trim().substring(dateParts[1].trim().length - 4),
                  10
                ); // Extract year from the end
                const monthYear = `${monthAbbr} ${year}`;

                // Only add this month if we haven't seen it before
                if (!monthlyData[monthYear]) {
                  monthlyData[monthYear] = 0;
                  if (!seenMonths.has(monthYear)) {
                    seenMonths.add(monthYear);
                    monthOrder.push(monthYear);
                  }
                }

                monthlyData[monthYear] += item.calls || 0;
              } catch (error) {
                console.error("Error processing date:", item.date, error);
              }
            });

            // Sort the month order chronologically
            monthOrder.sort((a, b) => {
              const aMonth = a.substring(0, 3);
              const aYear = parseInt(a.substring(4), 10);
              const bMonth = b.substring(0, 3);
              const bYear = parseInt(b.substring(4), 10);

              if (aYear !== bYear) return aYear - bYear;
              return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
            });

            // Get unique months only and maintain order
            const uniqueMonthOrder = [...new Set(monthOrder)];

            console.log("Month order after deduplication:", uniqueMonthOrder);

            // Convert to array format that matches the frontend
            const formattedData = uniqueMonthOrder.map((monthYear) => {
              const month = monthYear.substring(0, 3);
              const year = parseInt(monthYear.substring(4), 10);
              return {
                monthYear,
                month,
                year,
                calls: monthlyData[monthYear],
              };
            });

            // Total calls
            const totalCalls = Object.values(monthlyData).reduce(
              (sum, calls) => sum + calls,
              0
            );

            // Year-over-year change (first to last month)
            let yearOverYearHtml = "";
            if (formattedData.length >= 2) {
              const firstMonth = formattedData[0];
              const lastMonth = formattedData[formattedData.length - 1];
              const change =
                firstMonth.calls > 0
                  ? ((lastMonth.calls - firstMonth.calls) / firstMonth.calls) *
                    100
                  : 0;
              const changeFormatted = change.toFixed(1);
              const isPositive = change > 0;

              yearOverYearHtml = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                  <div>
                    <span style="font-weight: 500;">Total calls: </span>
                    <span style="font-weight: 600;">${totalCalls.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style="color: #6b7280;">Change from ${firstMonth.month} ${firstMonth.year} to ${lastMonth.month} ${lastMonth.year}: </span>
                    <span style="color: ${isPositive ? "#10B981" : "#EF4444"}; font-weight: 500;">${isPositive ? "+" : ""}${changeFormatted}%</span>
                  </div>
                </div>
              `;
            } else {
              yearOverYearHtml = `
                <div style="margin-bottom: 1rem;">
                  <span style="font-weight: 500;">Total calls: </span>
                  <span style="font-weight: 600;">${totalCalls.toLocaleString()}</span>
                </div>
              `;
            }

            // Calculate the Y-axis max value (rounded up to nearest multiple of 30)
            const maxCalls = Math.max(...Object.values(monthlyData), 30);
            const yAxisMax = Math.ceil(maxCalls / 30) * 30;

            // Generate visual elements for the chart
            let barsHtml = "";
            formattedData.forEach((data) => {
              const barHeight = (data.calls / yAxisMax) * 100;
              barsHtml += `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 5px;">
                  <div style="position: relative; width: 100%; height: 230px; display: flex; flex-direction: column; justify-content: flex-end;">
                    <div style="position: absolute; top: -24px; text-align: center; width: 100%;">
                      <span style="font-size: 0.875rem; font-weight: 500;">${data.calls}</span>
                    </div>
                    <div style="background-color: #4CAF50; width: 80%; height: ${barHeight}%; margin: 0 auto; border-radius: 4px 4px 0 0;"></div>
                  </div>
                  <div style="margin-top: 8px; text-align: center; font-size: 0.75rem; color: #6b7280;">
                    ${data.month} ${data.year}
                  </div>
                </div>
              `;
            });

            // Generate month-to-month changes
            let monthToMonthHtml = "";
            for (let i = 1; i < formattedData.length; i++) {
              const prevMonth = formattedData[i - 1];
              const currentMonth = formattedData[i];

              const changePercent =
                prevMonth.calls > 0
                  ? ((currentMonth.calls - prevMonth.calls) / prevMonth.calls) *
                    100
                  : 0;
              const formattedChange = changePercent.toFixed(1);
              const isPositive = changePercent > 0;

              monthToMonthHtml += `
                <div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem;">
                  <div style="font-size: 0.875rem; color: #6b7280;">${prevMonth.month} ${prevMonth.year} → ${currentMonth.month} ${currentMonth.year}</div>
                  <div style="font-size: 1rem; font-weight: 600; color: ${isPositive ? "#10B981" : "#EF4444"};">
                    ${isPositive ? "+" : ""}${formattedChange}%
                  </div>
                </div>
              `;
            }

            // Now put it all together
            return `
              ${yearOverYearHtml}
              
              <div class="chart-container" style="height: auto; min-height: 350px; position: relative;">
                <!-- Y-axis labels -->
                <div style="position: absolute; left: 10px; top: 20px; height: 230px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="font-size: 0.75rem; color: #6b7280;">${yAxisMax}</div>
                  <div style="font-size: 0.75rem; color: #6b7280;">${Math.round(yAxisMax * 0.75)}</div>
                  <div style="font-size: 0.75rem; color: #6b7280;">${Math.round(yAxisMax * 0.5)}</div>
                  <div style="font-size: 0.75rem; color: #6b7280;">${Math.round(yAxisMax * 0.25)}</div>
                  <div style="font-size: 0.75rem; color: #6b7280;">0</div>
                </div>
                
                <!-- Horizontal grid lines -->
                <div style="position: absolute; left: 40px; right: 20px; top: 20px; height: 230px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                  <div style="height: 1px; background-color: #e5e7eb;"></div>
                </div>
                
                <!-- Bar chart -->
                <div style="margin-left: 40px; margin-right: 20px; margin-top: 20px; margin-bottom: 10px; height: 260px; display: flex;">
                  ${barsHtml}
                </div>
                
                <!-- Legend -->
                <div style="margin-top: 10px; display: flex; justify-content: center;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 12px; height: 12px; margin-right: 6px; background-color: #4CAF50; border-radius: 2px;"></div>
                    <span style="font-size: 0.75rem; color: #6b7280;">Phone Calls</span>
                  </div>
                </div>
              </div>
              
              ${
                formattedData.length > 1
                  ? `
                <h3 style="font-size: 1rem; margin-top: 2rem; margin-bottom: 1rem; font-weight: 500;">Month-to-Month Changes</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                  ${monthToMonthHtml}
                </div>
              `
                  : ""
              }
            `;
          })()}
        </div>
        `
            : ""
        }

        <div class="footer">
          <p>Report generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
        </div>
      </body>
      </html>
    `;

    // Launch browser and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();

    // Return PDF
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="performance-report-gmb-${locationName}-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
