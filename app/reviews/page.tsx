"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MapPin,
  Filter,
  Settings,
  Clock,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Loader2,
  User,
} from "lucide-react";
import ReviewsList from "@/components/reviews/ReviewsList";
import ReviewDetail from "@/components/reviews/ReviewDetail";
import { toast } from "@/components/ui/sonner";

// Define types based on Prisma schema
interface Location {
  id: string;
  name: string;
  gmbLocationName: string;
}

interface ReviewReply {
  id: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  source: string;
  tone: string;
  createdAt: string;
  user: {
    name: string;
  } | null;
}

interface Review {
  id: string;
  locationId: string;
  reviewId: string;
  authorName: string;
  authorPhoto: string | null;
  rating: number;
  comment: string | null;
  createTime: string;
  updateTime: string;
  status: string;
  isProcessed: boolean;
  sentiment: string | null;
  location: {
    name: string;
    gmbLocationName: string;
  };
  replies: ReviewReply[];
}

// Define AI templates types
interface AITemplate {
  id: string;
  name: string;
  content: string;
  tone: string;
}

const aiTemplates: AITemplate[] = [
  {
    id: "1",
    name: "Positive Review Response",
    content:
      "Thank you for your kind words! We're delighted to hear you had such a positive experience with us. Your support means a lot, and we look forward to serving you again soon.",
    tone: "friendly",
  },
  {
    id: "2",
    name: "Neutral Review Response",
    content:
      "Thank you for sharing your feedback. We appreciate you taking the time to let us know about your experience. If there's anything we can do to improve your next visit, please don't hesitate to let us know.",
    tone: "formal",
  },
  {
    id: "3",
    name: "Negative Review Response",
    content:
      "We sincerely apologize for the disappointing experience you had. Your feedback is important to us, and we would like to make things right. Please contact our team directly so we can address your concerns properly.",
    tone: "apologetic",
  },
];

// Define AI suggestions types
const aiSuggestions = {
  positive: [
    "Thank you for your wonderful review! We're thrilled that you enjoyed your experience with us. Your satisfaction is our top priority, and we look forward to serving you again soon!",
    "We greatly appreciate your kind words and positive feedback! It's customers like you that make what we do so rewarding. We're looking forward to your next visit!",
  ],
  neutral: [
    "Thank you for taking the time to share your feedback. We value your input and will use it to improve our services. We hope to have the opportunity to serve you again soon.",
    "We appreciate your review and the feedback you've provided. If there's anything specific we can do to enhance your experience next time, please let us know!",
  ],
  negative: [
    "We sincerely apologize for your disappointing experience. Your feedback is important to us, and we would like to address your concerns directly. Please contact our manager at manager@ourbusiness.com so we can make things right.",
    "Thank you for bringing this to our attention. We're sorry that your experience didn't meet your expectations. We take all feedback seriously and will use this to improve. Please reach out to us directly so we can address your specific concerns.",
  ],
};

const Reviews = () => {
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("updateTime");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterReplySource, setFilterReplySource] = useState<string>("all");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(100);

  // Fetch reviews from API with filtering
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (selectedLocation !== "all") {
        params.append("locationId", selectedLocation);
      }

      if (filterStatus !== "all") {
        params.append("status", filterStatus.toUpperCase());
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (filterReplySource !== "all") {
        if (filterReplySource === "none") {
          params.append("replySource", "none");
        } else {
          params.append("replySource", filterReplySource.toUpperCase());
        }
      }

      params.append("sortBy", sortOption);
      params.append("sortOrder", "desc");
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/reviews?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setFilteredReviews(data.reviews);
      setLocations(data.locations);
      setTotalPages(data.pagination.totalPages);

      if (data.reviews.length > 0 && !selectedReview) {
        setSelectedReview(data.reviews[0]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReviews();
  }, [
    filterStatus,
    selectedLocation,
    sortOption,
    searchQuery,
    filterReplySource,
    page,
  ]);

  const handleSelectReview = (review: Review) => {
    setSelectedReview(review);
  };

  const handleSendReply = async (
    reviewId: string,
    replyContent: string,
    tone: string
  ) => {
    // If reviewId is "refresh", just refresh the data without sending a new reply
    if (reviewId === "refresh") {
      console.log("Refreshing review data...");
      try {
        await fetchReviews();
        return;
      } catch (error) {
        console.error("Error refreshing reviews:", error);
        toast.error("Failed to refresh reviews", {
          description: "Please try again or reload the page.",
        });
        return;
      }
    }

    try {
      const response = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          content: replyContent,
          tone,
          source: "MANUAL",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      // Refresh reviews data to show the updated state
      await fetchReviews();

      // Show success toast
      toast.success("Reply sent successfully!", {
        description:
          "Your response has been posted to Google Business Profile.",
      });

      // Find and update the selected review to match the refreshed data
      if (selectedReview) {
        const updatedReview = filteredReviews.find(
          (r) => r.id === selectedReview.id
        );
        if (updatedReview) {
          setSelectedReview(updatedReview);
        }
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    }
  };

  const handleUpdateStatus = async (reviewId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus.toUpperCase(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update review status");
      }

      // Refresh reviews data
      fetchReviews();

      toast.success(`Review marked as ${newStatus}`, {
        description: `The review has been updated to "${newStatus}" status.`,
      });
    } catch (error) {
      console.error("Error updating review status:", error);
      toast.error("Failed to update review status", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col h-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-locaposty-text-dark">
              Review Management
            </h1>
            <p className="text-locaposty-text-medium">
              Respond to customer reviews with AI-assisted replies
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => {
                window.location.href = "/settings/reviews";
              }}
            >
              <Settings className="mr-2 h-4 w-4" /> Auto-Reply Settings
            </Button>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="p-4 flex flex-col sm:flex-row justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Tabs
                defaultValue={filterStatus}
                onValueChange={setFilterStatus}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All Reviews</TabsTrigger>
                  <TabsTrigger value="pending">
                    <Clock className="h-4 w-4 mr-1" /> Pending
                  </TabsTrigger>
                  <TabsTrigger value="replied">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Replied
                  </TabsTrigger>
                  <TabsTrigger value="flagged">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Flagged
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Filter className="mr-2 h-4 w-4" /> Sort:{" "}
                    {sortOption === "updateTime"
                      ? "Recent First"
                      : sortOption === "rating"
                        ? "Highest Rating"
                        : sortOption === "status"
                          ? "By Status"
                          : "Recent First"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={sortOption === "updateTime"}
                    onCheckedChange={() => setSortOption("updateTime")}
                  >
                    Recent First
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortOption === "rating"}
                    onCheckedChange={() => setSortOption("rating")}
                  >
                    Highest Rating
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortOption === "status"}
                    onCheckedChange={() => setSortOption("status")}
                  >
                    By Status
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    {filterReplySource === "all"
                      ? "All Replies"
                      : filterReplySource === "auto_posted"
                        ? "Auto-Posted"
                        : filterReplySource === "ai_generated"
                          ? "AI-Generated"
                          : filterReplySource === "manual"
                            ? "Manual"
                            : "No Reply"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={filterReplySource === "all"}
                    onCheckedChange={() => setFilterReplySource("all")}
                  >
                    All Replies
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterReplySource === "auto_posted"}
                    onCheckedChange={() => setFilterReplySource("auto_posted")}
                  >
                    <Bot className="mr-2 h-4 w-4" /> Auto-Posted
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterReplySource === "ai_generated"}
                    onCheckedChange={() => setFilterReplySource("ai_generated")}
                  >
                    <Bot className="mr-2 h-4 w-4" /> AI-Generated
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterReplySource === "manual"}
                    onCheckedChange={() => setFilterReplySource("manual")}
                  >
                    <User className="mr-2 h-4 w-4" /> Manual
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterReplySource === "none"}
                    onCheckedChange={() => setFilterReplySource("none")}
                  >
                    No Reply
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {selectedLocation === "all"
                      ? "All Locations"
                      : locations.find((loc) => loc.id === selectedLocation)
                          ?.name || "Select Location"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocation === "all"}
                    onCheckedChange={() => setSelectedLocation("all")}
                  >
                    All Locations
                  </DropdownMenuCheckboxItem>
                  {locations.map((location) => (
                    <DropdownMenuCheckboxItem
                      key={location.id}
                      checked={selectedLocation === location.id}
                      onCheckedChange={() => setSelectedLocation(location.id)}
                    >
                      {location.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-9 w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          <div className="w-full lg:w-2/5 xl:w-1/3 overflow-auto border border-gray-100 rounded-lg bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-locaposty-primary" />
                <span className="ml-2 text-locaposty-text-medium">
                  Loading reviews...
                </span>
              </div>
            ) : (
              <ReviewsList
                reviews={filteredReviews}
                selectedReviewId={selectedReview?.id}
                onSelectReview={handleSelectReview}
              />
            )}

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-locaposty-text-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-3/5 xl:w-2/3 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-lg border border-gray-100">
                <Loader2 className="h-12 w-12 animate-spin text-locaposty-primary mb-4" />
                <h3 className="text-lg font-medium text-locaposty-text-dark mb-2">
                  Loading Review Details
                </h3>
                <p className="text-locaposty-text-medium max-w-md">
                  Please wait while we load the review details...
                </p>
              </div>
            ) : selectedReview ? (
              <ReviewDetail
                review={selectedReview}
                onSendReply={handleSendReply}
                onUpdateStatus={handleUpdateStatus}
                aiSuggestions={aiSuggestions}
                aiTemplates={aiTemplates}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-lg border border-gray-100">
                <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-locaposty-text-dark mb-2">
                  No Review Selected
                </h3>
                <p className="text-locaposty-text-medium max-w-md">
                  Select a review from the list to view details and respond with
                  AI-assisted replies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reviews;
