"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import UpcomingPosts from "@/components/dashboard/UpcomingPosts";
import ReviewSummary from "@/components/dashboard/ReviewSummary";
import GettingStarted from "@/components/dashboard/GettingStarted";
import NoLocationsState from "@/components/dashboard/NoLocationsState";
import { Calendar, Plus, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the location type
type Location = {
  id: string;
  name: string;
  gmbLocationName: string;
  address?: string;
  organizationId: string;
};

// Define the stats data type
type StatsDataType =
  | {
      postsScheduled?: number;
      newReviews?: number;
      profileViews?: number;
      customerActions?: number;
      reviewBreakdown?: {
        positive: number;
        neutral: number;
        negative: number;
      };
      changes?: {
        posts?: string;
        reviews?: string;
        views?: string;
        actions?: string;
      };
      trends?: {
        posts?: "up" | "down" | null;
        reviews?: "up" | "down" | null;
        views?: "up" | "down" | null;
        actions?: "up" | "down" | null;
      };
    }
  | undefined;

// Define post type
interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "update" | "offer" | "event";
  hasMedia: boolean;
  mediaCount?: number;
  location: string;
}

// Define review type
interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  replied: boolean;
}

// Define activity type
interface Activity {
  id: string;
  type: "post" | "review" | "reply" | "alert";
  action: string;
  title?: string;
  rating?: number;
  reviewer?: string;
  content?: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

// Define post stats type
interface PostStats {
  byStatus: {
    scheduled: number;
    published: number;
    draft: number;
    failed: number;
    deleted: number;
  };
  byType: {
    updates: number;
    events: number;
    offers: number;
  };
  byTime: {
    scheduledNext7Days: number;
    publishedLast7Days: number;
    publishedLast30Days: number;
    publishedThisMonth: number;
  };
  total: number;
}

// Create a separate component for the error banner that uses useSearchParams
const ErrorBanner = () => {
  const searchParams = useSearchParams();
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for error param in URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setShowErrorBanner(true);
      setErrorMessage(
        error === "trial_setup_failed"
          ? "We couldn't set up your trial subscription. Please try again or contact support."
          : "An error occurred while setting up your account."
      );
    }
  }, [searchParams]);

  // Function to dismiss the error banner
  const dismissErrorBanner = () => {
    setShowErrorBanner(false);
    // Remove the error from the URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url);
  };

  if (!showErrorBanner || !errorMessage) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span>{errorMessage}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissErrorBanner}
          className="h-6 w-6 p-0 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};

const MainDashboardClient = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsDataType>(undefined);
  const [postStats, setPostStats] = useState<PostStats | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews] = useState<Review[]>([]); // Not using setter for now
  const [activities] = useState<Activity[]>([]); // Not using setter for now
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  // Calculate trial days remaining
  useEffect(() => {
    if (
      session?.user?.subscriptionStatus === "TRIALING" &&
      session.user.trialEndsAt
    ) {
      const trialEnd = new Date(session.user.trialEndsAt);
      const now = new Date();

      // If trial is in the future
      if (trialEnd > now) {
        // Calculate days remaining
        const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setTrialDaysLeft(diffDays);
        setShowTrialBanner(true);
      }
    }
  }, [session]);

  // Function to handle location change
  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);

    // Store the selected location in local storage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedLocationId", locationId);
    }

    // Fetch data for the selected location
    fetchDataForLocation(locationId);
  };

  // Function to fetch all data for a specific location
  const fetchDataForLocation = async (locationId: string) => {
    if (!locationId) return;

    setIsLoading(true);
    try {
      // Fetch stats data
      await fetchStatsData(locationId);

      // Fetch post stats
      await fetchPostStats(locationId);

      // Fetch upcoming posts
      await fetchPosts(locationId);

      // Fetch reviews (not implemented in this task)

      // Fetch activities (could be implemented in future)

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data for location:", error);
      toast.error("Failed to load data for this location");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user locations from the database
    const fetchUserLocations = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          setIsLoading(true);
          // Use a session ID if available, otherwise use a placeholder
          const userId = session.user.id || "no-id";
          const response = await fetch(`/api/locations?userId=${userId}`);

          if (!response.ok) {
            throw new Error("Failed to fetch locations");
          }

          const data = await response.json();
          setLocations(data.locations);

          // Get saved location from local storage or use the first one
          let locationToUse = "";

          if (typeof window !== "undefined") {
            locationToUse = localStorage.getItem("selectedLocationId") || "";
          }

          // If no location in storage or the saved location isn't in the fetched locations, use the first one
          if (
            !locationToUse ||
            !data.locations.find((loc: Location) => loc.id === locationToUse)
          ) {
            locationToUse = data.length > 0 ? data[0].id : "";
          }

          setSelectedLocation(locationToUse);

          // If we have a location, fetch data for it
          if (locationToUse) {
            await fetchDataForLocation(locationToUse);
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error fetching locations:", error);
          toast.error("Failed to load locations");
          setLocations([]);
          setIsLoading(false);
        }
      } else if (status === "unauthenticated") {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchUserLocations();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session]);

  // Fetch stats data from the API
  const fetchStatsData = async (locationId: string): Promise<void> => {
    try {
      const response = await fetch(
        `/api/dashboard/stats?locationId=${locationId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stats data");
      }

      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error("Error fetching stats data:", error);
      setStatsData(undefined);
    }
  };

  // Fetch post stats from the API
  const fetchPostStats = async (locationId: string): Promise<void> => {
    try {
      const response = await fetch(
        `/api/dashboard/post-stats?locationId=${locationId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch post stats");
      }

      const data = await response.json();
      setPostStats(data);
    } catch (error) {
      console.error("Error fetching post stats:", error);
      setPostStats(undefined);
    }
  };

  // Fetch upcoming posts from the API
  const fetchPosts = async (locationId: string): Promise<void> => {
    try {
      const response = await fetch(
        `/api/dashboard/upcoming-posts?locationId=${locationId}&limit=5`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch upcoming posts");
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching upcoming posts:", error);
      setPosts([]);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-locaposty-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If user has no locations, show the no locations state
  if (locations.length === 0) {
    return (
      <DashboardLayout showLocationSelector={false}>
        <NoLocationsState />
      </DashboardLayout>
    );
  }

  // User data from session (real implementation would use actual user data)
  const userName = session?.user?.name || "";

  // Enhance stats data with post stats
  const enhancedStatsData: StatsDataType = {
    ...statsData,
    postsScheduled:
      postStats?.byStatus.scheduled || statsData?.postsScheduled || 0,
  };

  return (
    <DashboardLayout
      selectedLocationId={selectedLocation}
      onLocationChange={handleLocationChange}
      showLocationSelector={true}
    >
      {/* Wrap the ErrorBanner component with Suspense */}
      <Suspense fallback={<div className="mb-4 h-16"></div>}>
        <ErrorBanner />
      </Suspense>

      {/* Trial Banner */}
      {showTrialBanner && trialDaysLeft !== null && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-600">
            Trial Subscription Active
          </AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              You have <span className="font-bold">{trialDaysLeft}</span>{" "}
              {trialDaysLeft === 1 ? "day" : "days"} left in your trial. Upgrade
              now to continue using all features after your trial ends.
            </span>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="p-6">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-locaposty-text-dark">
              Welcome back, {userName.split(" ")[0]}!
            </h1>
            <p className="text-locaposty-text-medium">
              Here&apos;s what&apos;s happening with your business locations
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/posts/new">
              <Button
                variant="outline"
                className="border-locaposty-primary text-locaposty-primary hover:bg-locaposty-primary/10"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Post
              </Button>
            </Link>
            <Link href="/posts">
              <Button className="bg-locaposty-primary hover:bg-locaposty-primary/90">
                <Calendar className="mr-2 h-4 w-4" /> View Calendar
              </Button>
            </Link>
          </div>
        </header>

        <QuickStats data={enhancedStatsData} />

        {postStats && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-lg text-locaposty-text-dark mb-4">
              Post Statistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-locaposty-text-medium mb-2">
                  By Status
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byStatus.scheduled}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Scheduled
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byStatus.published}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Published
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byStatus.draft}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Draft
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byStatus.failed}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Failed
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-locaposty-text-medium mb-2">
                  By Type
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byType.updates}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Updates
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byType.events}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Events
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byType.offers}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Offers
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-locaposty-text-medium mb-2">
                  Recent Activity
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byTime.scheduledNext7Days}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Next 7 days
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byTime.publishedLast7Days}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Last 7 days
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byTime.publishedThisMonth}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      This month
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-locaposty-text-dark">
                      {postStats.byTime.publishedLast30Days}
                    </div>
                    <div className="text-xs text-locaposty-text-medium">
                      Last 30 days
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-locaposty-text-medium mb-2">
                  Summary
                </h3>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-locaposty-text-dark">
                      {postStats.total}
                    </div>
                    <div className="text-sm text-locaposty-text-medium">
                      Total Posts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <ActivityTimeline activities={activities} />
            <UpcomingPosts className="mt-6" posts={posts} />
          </div>
          <div className="space-y-6">
            <ReviewSummary reviews={reviews} />
            <GettingStarted />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MainDashboardClient;
