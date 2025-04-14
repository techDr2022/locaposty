"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  MapPin,
  Filter,
  Flag,
  Star,
  Settings,
  Send,
  Clock,
  User,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  mockReviews,
  aiTemplates,
  aiSuggestions,
  ReviewType,
} from "@/data/mockReviewsData";
import ReviewsList from "@/components/reviews/ReviewsList";
import ReviewDetail from "@/components/reviews/ReviewDetail";
import { toast } from "@/components/ui/sonner";

const Reviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(mockReviews);
  const [filteredReviews, setFilteredReviews] = useState(mockReviews);
  const [selectedReview, setSelectedReview] = useState<ReviewType | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("date");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let filtered = [...reviews];

    if (filterStatus !== "all") {
      filtered = filtered.filter((review) => review.status === filterStatus);
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter(
        (review) => review.location === selectedLocation
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.content.toLowerCase().includes(query) ||
          review.authorName.toLowerCase().includes(query)
      );
    }

    switch (sortOption) {
      case "date":
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "status":
        filtered.sort((a, b) => {
          const statusPriority = { flagged: 0, pending: 1, replied: 2 };
          return statusPriority[a.status] - statusPriority[b.status];
        });
        break;
    }

    setFilteredReviews(filtered);

    if (filtered.length > 0) {
      if (
        !selectedReview ||
        !filtered.find((r) => r.id === selectedReview.id)
      ) {
        setSelectedReview(filtered[0]);
      }
    } else {
      setSelectedReview(null);
    }
  }, [reviews, filterStatus, selectedLocation, sortOption, searchQuery]);

  const handleSelectReview = (review: ReviewType) => {
    setSelectedReview(review);
  };

  const handleSendReply = (reviewId: string, replyContent: string) => {
    const updatedReviews = reviews.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          replyContent: replyContent,
          replyDate: new Date().toISOString(),
          status: "replied" as const,
        };
      }
      return review;
    });

    setReviews(updatedReviews);

    toast.success("Reply sent successfully!", {
      description: "Your response has been posted to Google Business Profile.",
    });
  };

  const handleUpdateStatus = (
    reviewId: string,
    newStatus: "pending" | "replied" | "flagged"
  ) => {
    const updatedReviews = reviews.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          status: newStatus,
        };
      }
      return review;
    });

    setReviews(updatedReviews);

    toast.success(`Review marked as ${newStatus}`, {
      description: `The review has been updated to "${newStatus}" status.`,
    });
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
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => {
              toast("AI settings feature is coming soon!");
            }}
          >
            <Settings className="mr-2 h-4 w-4" /> AI Settings
          </Button>
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
                    {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={sortOption === "date"}
                    onCheckedChange={() => setSortOption("date")}
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
                      : selectedLocation === "sf"
                      ? "San Francisco"
                      : selectedLocation === "nyc"
                      ? "New York"
                      : "Los Angeles"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocation === "all"}
                    onCheckedChange={() => setSelectedLocation("all")}
                  >
                    All Locations
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocation === "sf"}
                    onCheckedChange={() => setSelectedLocation("sf")}
                  >
                    San Francisco
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocation === "nyc"}
                    onCheckedChange={() => setSelectedLocation("nyc")}
                  >
                    New York
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocation === "la"}
                    onCheckedChange={() => setSelectedLocation("la")}
                  >
                    Los Angeles
                  </DropdownMenuCheckboxItem>
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
            <ReviewsList
              reviews={filteredReviews}
              selectedReviewId={selectedReview?.id}
              onSelectReview={handleSelectReview}
            />
          </div>

          <div className="w-full lg:w-3/5 xl:w-2/3 overflow-auto">
            {selectedReview ? (
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
