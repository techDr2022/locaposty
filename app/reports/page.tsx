"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#FF4B4B", "#FFA726", "#FFD600", "#66BB6A", "#42A5F5"];

export default function ReportsPage() {
  const [timePeriod, setTimePeriod] = useState("30days");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Track when both dates have been selected by user
  const [dateSelectionComplete, setDateSelectionComplete] = useState(true);

  const [performanceData, setPerformanceData] = useState<
    {
      date: string;
      views: number;
      clicks: number;
      calls: number;
      directions: number;
      bookings: number;
      foodOrders: number;
      conversations: number;
      mobileMapViews: number;
      mobileSearchViews: number;
      desktopMapViews: number;
      desktopSearchViews: number;
      [key: string]: number | string;
    }[]
  >([]);
  const [reviewData, setReviewData] = useState<{
    summary: {
      totalReviews: number;
      averageRating: number;
      ratingDistribution: {
        oneStar: number;
        twoStar: number;
        threeStar: number;
        fourStar: number;
        fiveStar: number;
      };
      replyRate: number;
      averageReplyResponseTime: number;
    };
    timeSeries: Array<{
      date: string;
      total: number;
      positive: number;
      negative: number;
      neutral: number;
      replied: number;
    }>;
  } | null>(null);
  const [searchKeywords, setSearchKeywords] = useState<
    Array<{
      keyword: string;
      impressions: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Add new state for monthly comparison data
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<
    {
      monthYear: string;
      month: string;
      year: number;
      calls: number;
    }[]
  >([]);

  // Add function to process monthly comparison data with proper typing
  const processMonthlyComparisonData = (
    data: Array<{
      date: string;
      calls: number;
      views: number;
      clicks: number;
      directions: number;
    }>
  ) => {
    if (data.length === 0) return;

    console.log(
      "Raw performance data dates:",
      data.map((item) => item.date)
    );

    // Group the data by month and year
    const monthlyData = data.reduce(
      (acc, item) => {
        try {
          // First, ensure we're working with valid date objects
          let date: Date;

          // Try different date parsing approaches
          if (typeof item.date === "string") {
            // Try to handle various date formats
            if (item.date.includes("-")) {
              // Likely ISO format or similar (2024-01-15)
              const parts = item.date.split("-");
              if (parts.length >= 3) {
                // Ensure we're getting the correct year (not default to 2001)
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // 0-based months
                const day = parseInt(parts[2], 10);

                console.log("Parsed date parts:", year, month, day);

                date = new Date(year, month, day);
              } else {
                date = new Date(item.date);
              }
            } else {
              date = new Date(item.date);
            }
          } else {
            date = new Date(item.date);
          }

          console.log(
            "Processing date:",
            item.date,
            "Parsed as:",
            date.toISOString(),
            "Year:",
            date.getFullYear()
          );

          // Manually construct the month-year string to avoid any locale issues
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
          const monthName = monthNames[date.getMonth()];
          const year = date.getFullYear();
          const monthYear = `${monthName} ${year}`;

          console.log("Manually formatted month-year:", monthYear);

          if (!acc[monthYear]) {
            acc[monthYear] = { calls: 0 };
          }

          acc[monthYear].calls += item.calls;
        } catch (error) {
          console.error("Error processing date:", item.date, error);
        }
        return acc;
      },
      {} as Record<string, { calls: number }>
    );

    console.log("Grouped monthly data:", monthlyData);

    // Convert to array format for the chart
    const formattedData = Object.entries(monthlyData).map(
      ([monthYear, data]) => {
        try {
          const parts = monthYear.split(" ");
          const month = parts[0];
          const year = parseInt(parts[1], 10);

          console.log("Parsed month/year from:", monthYear, "->", month, year);

          return {
            monthYear,
            month,
            year,
            calls: data.calls,
          };
        } catch (error) {
          console.error("Error parsing monthYear:", monthYear, error);
          // Provide fallback in case of parsing errors
          return {
            monthYear,
            month: monthYear.split(" ")[0] || "Unknown",
            year: new Date().getFullYear(),
            calls: data.calls,
          };
        }
      }
    );

    // Sort chronologically by date
    formattedData.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }

      const monthOrder = [
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
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    console.log("Final formatted and sorted data:", formattedData);

    setMonthlyComparisonData(formattedData);
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!selectedLocationId || !dateSelectionComplete) return;

      setIsLoading(true);
      try {
        // Format dates for API request
        const from = dateRange.from;
        const to = dateRange.to;

        console.log("Fetching data with date range:", {
          from: from.toISOString(),
          fromFormatted: format(from, "MMM d, yyyy"),
          to: to.toISOString(),
          toFormatted: format(to, "MMM d, yyyy"),
        });

        const response = await fetch(
          `/api/reports/performance?start_date=${from.toISOString()}&end_date=${to.toISOString()}&locationId=${selectedLocationId}`
        );

        const reviewsResponse = await fetch(
          `/api/reports/reviews?start_date=${from.toISOString()}&end_date=${to.toISOString()}&locationId=${selectedLocationId}`
        );

        if (!response.ok || !reviewsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        const reviewsData = await reviewsResponse.json();

        console.log("API response performance data:", data.data.performance);

        if (data.success) {
          setPerformanceData(data.data.performance);
          setReviewData(reviewsData.data);
          setSearchKeywords(data.data.searchKeywords || []);

          // Process monthly comparison data
          processMonthlyComparisonData(data.data.performance);
        } else {
          console.error("Failed to fetch performance data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [dateRange, selectedLocationId, dateSelectionComplete]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations");
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }
        const data = await response.json();
        if (data.success) {
          // We don't need to set locations anymore, but we could use it for validation
          const locationExists = data.data.some(
            (loc: { id: string }) => loc.id === selectedLocationId
          );
          if (selectedLocationId && !locationExists) {
            // Reset selected location if it no longer exists
            setSelectedLocationId("");
          }
        } else {
          console.error("Failed to fetch locations:", data.error);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [selectedLocationId]);

  // Handle time period selection (this should reset dateSelectionComplete)
  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
    const now = new Date();
    let fromDate;

    switch (value) {
      case "7days":
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90days":
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    console.log("handleTimePeriodChange setting date range:", {
      from: fromDate.toISOString(),
      fromFormatted: format(fromDate, "MMM d, yyyy"),
      to: now.toISOString(),
      toFormatted: format(now, "MMM d, yyyy"),
    });

    setDateRange({
      from: fromDate,
      to: now,
    });

    // Set dateSelectionComplete to true since we're setting both dates
    setDateSelectionComplete(true);
  };

  // Helper function to get colors from our theme
  const getChartColors = () => {
    return {
      primary: "#1E56A0",
      secondary: "#F76E11",
      accent: "#D6E4F0",
      text: "#333333",
      gridLines: "#EEEEEE",
    };
  };

  const colors = getChartColors();

  const chartConfig = {
    views: { color: colors.primary, label: "Views" },
    clicks: { color: colors.secondary, label: "Clicks" },
    calls: { color: "#4CAF50", label: "Calls" },
    directions: { color: "#9C27B0", label: "Directions" },
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
  };

  // Function to handle PDF download
  const handleDownloadReport = async () => {
    if (!selectedLocationId) return;

    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/reports/download?start_date=${dateRange.from.toISOString()}&end_date=${dateRange.to.toISOString()}&locationId=${selectedLocationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            performanceData,
            reviewData,
            searchKeywords,
            locationId: selectedLocationId,
            dateRange: {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `performance-report-${format(dateRange.from, "yyyy-MM-dd")}-to-${format(dateRange.to, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Before return, check if we have multiple months of data
  const hasMultipleMonths = monthlyComparisonData.length > 1;

  return (
    <DashboardLayout
      showLocationSelector={true}
      selectedLocationId={selectedLocationId}
      onLocationChange={handleLocationChange}
    >
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Performance Reports
              </h1>
              {!isLoading && selectedLocationId && (
                <Button
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloading ? "Generating PDF..." : "Download Report"}
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">
              View your Google Business Profile performance analytics and
              insights
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-[160px]",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, "LLL dd, y")
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => {
                        if (date) {
                          console.log(
                            "Calendar start date selected:",
                            date.toISOString()
                          );
                          // If selected date is after end date, adjust end date
                          const newEndDate =
                            date > dateRange.to ? date : dateRange.to;

                          const newRange = {
                            from: date,
                            to: newEndDate,
                          };

                          console.log("Setting new date range (start date):", {
                            from: newRange.from.toISOString(),
                            fromFormatted: format(newRange.from, "MMM d, yyyy"),
                            to: newRange.to.toISOString(),
                            toFormatted: format(newRange.to, "MMM d, yyyy"),
                          });

                          setDateRange(newRange);

                          // Don't trigger data fetch yet, only update start date
                          setDateSelectionComplete(false);
                        }
                      }}
                      initialFocus
                      defaultMonth={dateRange.from}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-[160px]",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, "LLL dd, y")
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => {
                        if (date) {
                          console.log(
                            "Calendar end date selected:",
                            date.toISOString()
                          );
                          // If selected date is before start date, adjust start date
                          const newStartDate =
                            date < dateRange.from ? date : dateRange.from;

                          const newRange = {
                            from: newStartDate,
                            to: date,
                          };

                          console.log("Setting new date range (end date):", {
                            from: newRange.from.toISOString(),
                            fromFormatted: format(newRange.from, "MMM d, yyyy"),
                            to: newRange.to.toISOString(),
                            toFormatted: format(newRange.to, "MMM d, yyyy"),
                          });

                          setDateRange(newRange);

                          // Now both dates are selected, trigger data fetch
                          setDateSelectionComplete(true);
                        }
                      }}
                      initialFocus
                      defaultMonth={dateRange.to}
                      fromDate={dateRange.from}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex space-x-2">
              <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedLocationId ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Please select a location to view performance reports.
              </p>
            </Card>
          ) : isLoading ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Loading performance data...
              </p>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="impressions">Impressions</TabsTrigger>
                <TabsTrigger value="actions">Customer Actions</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="keywords">Search Keywords</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Views
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce((sum, item) => sum + item.views, 0)
                          .toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Website Clicks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce((sum, item) => sum + item.clicks, 0)
                          .toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Direction Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce((sum, item) => sum + item.directions, 0)
                          .toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Phone Calls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce((sum, item) => sum + item.calls, 0)
                          .toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>
                      Total views and actions over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <LineChart data={performanceData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colors.gridLines}
                        />
                        <XAxis dataKey="date" stroke={colors.text} />
                        <YAxis stroke={colors.text} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="views"
                          stroke={colors.primary}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="clicks"
                          stroke={colors.secondary}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="directions"
                          stroke="#9C27B0"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="calls"
                          stroke="#4CAF50"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="impressions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Impressions by Platform</CardTitle>
                    <CardDescription>
                      Breakdown of views by device and platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <AreaChart data={performanceData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colors.gridLines}
                        />
                        <XAxis dataKey="date" stroke={colors.text} />
                        <YAxis stroke={colors.text} />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stackId="1"
                          stroke={colors.primary}
                          fill={colors.primary}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mobile vs Desktop</CardTitle>
                      <CardDescription>
                        Impressions by device type
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                      <PieChart width={300} height={300}>
                        <Pie
                          data={[
                            {
                              name: "Mobile",
                              value: performanceData.reduce(
                                (sum, item) =>
                                  sum +
                                  (item.mobileMapViews || 0) +
                                  (item.mobileSearchViews || 0),
                                0
                              ),
                            },
                            {
                              name: "Desktop",
                              value: performanceData.reduce(
                                (sum, item) =>
                                  sum +
                                  (item.desktopMapViews || 0) +
                                  (item.desktopSearchViews || 0),
                                0
                              ),
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          <Cell fill="#1E56A0" />
                          <Cell fill="#F76E11" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Search vs Maps</CardTitle>
                      <CardDescription>
                        Impressions by Google platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                      <PieChart width={300} height={300}>
                        <Pie
                          data={[
                            {
                              name: "Search",
                              value: performanceData.reduce(
                                (sum, item) =>
                                  sum +
                                  (item.mobileSearchViews || 0) +
                                  (item.desktopSearchViews || 0),
                                0
                              ),
                            },
                            {
                              name: "Maps",
                              value: performanceData.reduce(
                                (sum, item) =>
                                  sum +
                                  (item.mobileMapViews || 0) +
                                  (item.desktopMapViews || 0),
                                0
                              ),
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          <Cell fill="#66BB6A" />
                          <Cell fill="#9C27B0" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Actions</CardTitle>
                    <CardDescription>
                      Breakdown of all customer interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={performanceData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colors.gridLines}
                        />
                        <XAxis dataKey="date" stroke={colors.text} />
                        <YAxis stroke={colors.text} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="clicks"
                          name="Website Clicks"
                          fill={colors.secondary}
                        />
                        <Bar
                          dataKey="calls"
                          name="Phone Calls"
                          fill="#4CAF50"
                        />
                        <Bar
                          dataKey="directions"
                          name="Direction Requests"
                          fill="#9C27B0"
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Add monthly phone calls comparison card if multiple months are selected */}
                {hasMultipleMonths && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Phone Calls Comparison</CardTitle>
                      <CardDescription>
                        Comparison of phone calls across different months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            <span className="text-muted-foreground">
                              Total calls:{" "}
                            </span>
                            {monthlyComparisonData
                              .reduce((total, month) => total + month.calls, 0)
                              .toLocaleString()}
                          </div>
                          {monthlyComparisonData.length >= 2 && (
                            <div className="text-sm font-medium">
                              <span className="text-muted-foreground">
                                Change from {monthlyComparisonData[0].month}{" "}
                                {monthlyComparisonData[0].year} to{" "}
                                {
                                  monthlyComparisonData[
                                    monthlyComparisonData.length - 1
                                  ].month
                                }{" "}
                                {
                                  monthlyComparisonData[
                                    monthlyComparisonData.length - 1
                                  ].year
                                }
                                :
                              </span>
                              {(() => {
                                const firstMonth = monthlyComparisonData[0];
                                const lastMonth =
                                  monthlyComparisonData[
                                    monthlyComparisonData.length - 1
                                  ];
                                const percentChange =
                                  firstMonth.calls > 0
                                    ? (
                                        ((lastMonth.calls - firstMonth.calls) /
                                          firstMonth.calls) *
                                        100
                                      ).toFixed(1)
                                    : "N/A";
                                const isPositive =
                                  parseFloat(percentChange) > 0;

                                return (
                                  <span
                                    className={
                                      isPositive
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {isPositive ? "+" : ""}
                                    {percentChange}%
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChartContainer
                        config={chartConfig}
                        className="h-[300px]"
                      >
                        <BarChart data={monthlyComparisonData}>
                          {console.log(
                            "Chart rendering with data:",
                            monthlyComparisonData
                          )}
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={colors.gridLines}
                          />
                          <XAxis
                            dataKey="monthYear"
                            stroke={colors.text}
                            // Ensure we show the full month and year
                            tickFormatter={(value) => {
                              console.log("XAxis formatting value:", value);
                              return value; // Show full month and year (Jan 2024, Feb 2024, etc.)
                            }}
                          />
                          <YAxis stroke={colors.text} />
                          <Tooltip
                            formatter={(value) => [
                              `${value} calls`,
                              "Phone Calls",
                            ]}
                            labelFormatter={(label) => {
                              console.log("Tooltip formatting label:", label);
                              return label;
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="calls"
                            name="Phone Calls"
                            fill="#4CAF50"
                            radius={[4, 4, 0, 0]}
                            label={{
                              position: "top",
                              formatter: (value: number) =>
                                value > 0 ? value.toString() : "",
                              fill: colors.text,
                              fontSize: 12,
                            }}
                          />
                        </BarChart>
                      </ChartContainer>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                          Month-to-Month Changes
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {monthlyComparisonData.length > 1 &&
                            monthlyComparisonData
                              .slice(1)
                              .map((month, index) => {
                                const prevMonth = monthlyComparisonData[index];

                                console.log("Rendering comparison:", {
                                  prevMonth: prevMonth.monthYear,
                                  currentMonth: month.monthYear,
                                  prevMonthYear: prevMonth.year,
                                  currentMonthYear: month.year,
                                });

                                const change =
                                  prevMonth.calls > 0
                                    ? (
                                        ((month.calls - prevMonth.calls) /
                                          prevMonth.calls) *
                                        100
                                      ).toFixed(1)
                                    : "N/A";
                                const isPositive = parseFloat(change) > 0;

                                return (
                                  <div
                                    key={month.monthYear}
                                    className="flex items-center justify-between p-2 border rounded"
                                  >
                                    <div className="text-sm">
                                      {prevMonth.month} {prevMonth.year} →{" "}
                                      {month.month} {month.year}
                                    </div>
                                    <div
                                      className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {isPositive ? "+" : ""}
                                      {change}%
                                    </div>
                                  </div>
                                );
                              })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce((sum, item) => sum + (item.bookings || 0), 0)
                          .toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Food Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce(
                            (sum, item) => sum + (item.foodOrders || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Messages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {performanceData
                          .reduce(
                            (sum, item) => sum + (item.conversations || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Reviews
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {reviewData?.summary.totalReviews.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Average Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {reviewData?.summary.averageRating.toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Reply Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {reviewData?.summary.replyRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Avg. Response Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {reviewData?.summary.averageReplyResponseTime}h
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(dateRange.from, "MMM d")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rating Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of reviews by star rating
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <PieChart width={300} height={300}>
                          <Pie
                            data={Object.entries(
                              reviewData?.summary.ratingDistribution || {}
                            ).map(([key, value]) => ({
                              name: key.replace("Star", " Star"),
                              value,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {Object.entries(
                              reviewData?.summary.ratingDistribution || {}
                            ).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Review Trends</CardTitle>
                      <CardDescription>
                        Daily review volume and sentiment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={chartConfig}
                        className="h-[300px]"
                      >
                        <AreaChart data={reviewData?.timeSeries}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={colors.gridLines}
                          />
                          <XAxis dataKey="date" stroke={colors.text} />
                          <YAxis stroke={colors.text} />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stackId="1"
                            stroke={colors.primary}
                            fill={colors.primary}
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="positive"
                            stackId="2"
                            stroke="#66BB6A"
                            fill="#66BB6A"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="negative"
                            stackId="2"
                            stroke="#FF4B4B"
                            fill="#FF4B4B"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="keywords" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Search Keywords</CardTitle>
                    <CardDescription>
                      Most common search terms that led to your business profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {searchKeywords.length > 0 ? (
                        <div className="grid gap-2">
                          {searchKeywords.map((keyword, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  #{index + 1}
                                </span>
                                <span className="text-sm font-medium">
                                  {keyword.keyword}
                                </span>
                              </div>
                              <div className="text-sm font-medium">
                                {keyword.impressions.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm">
                          No search keywords data available for the selected
                          period.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Metrics</CardTitle>
                    <CardDescription>
                      Advanced performance indicators and conversion rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            CTR (Click-Through Rate)
                          </span>
                          <span className="text-xl font-bold">
                            {(
                              (performanceData.reduce(
                                (sum, item) => sum + item.clicks,
                                0
                              ) /
                                performanceData.reduce(
                                  (sum, item) => sum + item.views,
                                  0
                                )) *
                              100
                            ).toFixed(2)}
                            %
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Actions per View
                          </span>
                          <span className="text-xl font-bold">
                            {(
                              performanceData.reduce(
                                (sum, item) =>
                                  sum +
                                  item.clicks +
                                  item.calls +
                                  item.directions,
                                0
                              ) /
                              performanceData.reduce(
                                (sum, item) => sum + item.views,
                                0
                              )
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Average Daily Views
                          </span>
                          <span className="text-xl font-bold">
                            {Math.round(
                              performanceData.reduce(
                                (sum, item) => sum + item.views,
                                0
                              ) / performanceData.length
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="pt-4">
                        <h3 className="text-lg font-medium mb-4">
                          Performance Trend
                        </h3>
                        <ChartContainer
                          config={chartConfig}
                          className="h-[300px]"
                        >
                          <LineChart data={performanceData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={colors.gridLines}
                            />
                            <XAxis dataKey="date" stroke={colors.text} />
                            <YAxis stroke={colors.text} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="views"
                              stroke={colors.primary}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ChartContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
