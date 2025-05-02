"use client";
import React, { useState, useEffect } from "react";
import { format, addMonths, subMonths, isFuture } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  MapPin,
  Tag,
  AlertTriangle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarListView from "@/components/calendar/CalendarListView";
import CalendarSidePanel from "@/components/calendar/CalendarSidePanel";
import CreatePostModal from "@/components/calendar/CreatePostModal";
import BulkOperationsPanel from "@/components/calendar/BulkOperationsPanel";
import NoPostLocationsState from "@/components/dashboard/NoPostLocationsState";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Define types based on Prisma schema
type Post = {
  id: string;
  locationId: string;
  title: string;
  content: string;
  type: "WHATS_NEW" | "EVENT" | "OFFER";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "DELETED";
  mediaUrls: string[];
  scheduledAt: string | Date;
  publishedAt?: string | Date | null;
  location?: {
    id: string;
    name: string;
    gmbLocationName: string;
    logoUrl?: string | null;
  };
};

// Define a type for location
type Location = {
  id: string;
  name: string;
  gmbLocationName: string;
};

const CalendarPage = () => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditPost, setCurrentEditPost] = useState<string | null>(null);
  const [selectedLocationFilter, setSelectedLocationFilter] =
    useState<string>("all");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([
    "WHATS_NEW",
    "EVENT",
    "OFFER",
  ]);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([
    "DRAFT",
    "SCHEDULED",
    "PUBLISHED",
    "FAILED",
  ]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishingPostIds, setPublishingPostIds] = useState<string[]>([]);

  // Fetch locations when session is available
  useEffect(() => {
    const fetchLocations = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          setLoading(true);
          const response = await fetch("/api/locations");
          console.log(response);

          if (!response.ok) {
            throw new Error("Failed to fetch locations");
          }

          const data = await response.json();
          setLocations(data.locations || []);
        } catch (error) {
          console.error("Error fetching locations:", error);
          setError("Failed to fetch locations");
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [session, status]);

  // Fetch posts when locations or filters change
  useEffect(() => {
    const fetchPosts = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          setLoading(true);

          // Build query params
          const queryParams = new URLSearchParams();

          if (selectedLocationFilter !== "all") {
            queryParams.append("locationId", selectedLocationFilter);
          }

          if (selectedTypeFilters.length && selectedTypeFilters.length < 3) {
            // If not all are selected, add as filter
            queryParams.append("type", selectedTypeFilters[0]);
          }

          if (
            selectedStatusFilters.length &&
            selectedStatusFilters.length < 4
          ) {
            // If not all are selected, add as filter
            queryParams.append("status", selectedStatusFilters[0]);
          }

          const response = await fetch(`/api/posts?${queryParams.toString()}`);

          if (!response.ok) {
            throw new Error("Failed to fetch posts");
          }

          const data = await response.json();
          setPosts(data.posts);
        } catch (error) {
          console.error("Error fetching posts:", error);
          setError("Failed to fetch posts");
        } finally {
          setLoading(false);
        }
      }
    };

    if (locations.length > 0) {
      fetchPosts();
    }
  }, [
    session,
    status,
    locations,
    selectedLocationFilter,
    selectedTypeFilters,
    selectedStatusFilters,
  ]);

  const hasLocations = locations.length > 0;

  const filteredPosts = posts.filter((post) => {
    // Already filtered by API query params, but we also filter locally for immediate UI updates
    const matchesLocation =
      selectedLocationFilter === "all" ||
      post.locationId === selectedLocationFilter;
    const matchesType = selectedTypeFilters.includes(post.type);
    const matchesStatus = selectedStatusFilters.includes(post.status);
    return matchesLocation && matchesType && matchesStatus;
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleCreatePost = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditPost = (postId: string) => {
    setCurrentEditPost(postId);
    setIsEditModalOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Update local state to reflect deletion
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      // Set loading state
      setPublishingPostIds((prev) => [...prev, postId]);
      console.log(`[DEBUG] Starting publish for post ID: ${postId}`);

      const post = posts.find((p) => p.id === postId);
      if (!post) {
        console.error(`[DEBUG] Post with ID ${postId} not found in state`);
        throw new Error("Error: Post not found in the current view");
      }

      console.log(`[DEBUG] Found post in state:`, post);

      // Check if post status is valid for publishing
      if (post.status !== "DRAFT" && post.status !== "SCHEDULED") {
        console.error(
          `[DEBUG] Post status (${post.status}) not valid for publishing`
        );
        throw new Error(
          `This post cannot be published because its status is ${post.status}. Only draft or scheduled posts can be published.`
        );
      }

      console.log(
        `[DEBUG] Sending request to /api/posts/publish for post with status ${post.status}`
      );

      const response = await fetch("/api/posts/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[DEBUG] API error response:`, errorData);
        throw new Error(errorData.error || "Failed to publish post");
      }

      const updatedPost = await response.json();
      console.log(`[DEBUG] Post published successfully:`, updatedPost);

      // Update the posts array with the updated post
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, ...updatedPost } : p))
      );

      // Show success toast
      toast.success(`"${post.title}" has been queued for publishing`, {
        description: "It will be published to Google Business Profile shortly",
        duration: 5000,
      });

      return updatedPost;
    } catch (error) {
      console.error("[DEBUG] Publish error:", error);

      // Mark the post as failed in our local state
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, status: "FAILED" } : p))
      );

      // Show error toast with details
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to publish post", {
        description: errorMessage,
        duration: 8000,
      });

      throw error;
    } finally {
      // Remove from publishing state
      setPublishingPostIds((prev) => prev.filter((id) => id !== postId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;

    try {
      const deletePromises = selectedPosts.map((postId) =>
        fetch(`/api/posts?id=${postId}`, {
          method: "DELETE",
        })
      );

      await Promise.all(deletePromises);

      // Update local state to reflect deletion
      setPosts((prev) =>
        prev.filter((post) => !selectedPosts.includes(post.id))
      );
      return Promise.resolve();
    } catch (error) {
      console.error("Error bulk deleting posts:", error);
      return Promise.reject(error);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedPosts.length === 0) {
      toast.warning("No posts selected");
      return;
    }

    // Filter only posts that can be published (DRAFT or SCHEDULED)
    const postsToPublish = posts.filter(
      (post) =>
        selectedPosts.includes(post.id) &&
        (post.status === "DRAFT" || post.status === "SCHEDULED")
    );

    if (postsToPublish.length === 0) {
      toast.warning(
        "None of the selected posts can be published. Only draft or scheduled posts can be published."
      );
      return;
    }

    // Track success and failures
    const successPosts: string[] = [];
    const failedPosts: { id: string; title: string; error: string }[] = [];

    // Set all as publishing
    setPublishingPostIds((prev) => [
      ...prev,
      ...postsToPublish.map((p) => p.id),
    ]);

    for (const post of postsToPublish) {
      try {
        await handlePublishNow(post.id);
        successPosts.push(post.id);
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        failedPosts.push({
          id: post.id,
          title: post.title,
          error: errorMessage,
        });
      }
    }

    // Show summary of results
    if (successPosts.length > 0 && failedPosts.length === 0) {
      // All successful
      toast.success(`Successfully published ${successPosts.length} posts`, {
        description: "All selected posts have been queued for publishing",
      });
    } else if (successPosts.length === 0 && failedPosts.length > 0) {
      // All failed
      toast.error(`Failed to publish ${failedPosts.length} posts`, {
        description: "Check each post for specific errors",
      });
    } else {
      // Mixed results
      toast.warning(
        `Published ${successPosts.length} posts, failed to publish ${failedPosts.length} posts`,
        {
          description:
            "Some posts failed to publish. Review status in the calendar.",
        }
      );
    }

    // Clear selection after bulk operation
    clearSelection();
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const clearSelection = () => {
    setSelectedPosts([]);
  };

  const toggleSidePanel = () => {
    setShowSidePanel((prev) => !prev);
  };

  // Get upcoming posts for side panel
  const upcomingPosts = posts
    .filter(
      (post) =>
        (post.status === "SCHEDULED" || post.status === "DRAFT") &&
        isFuture(new Date(post.scheduledAt))
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
    .slice(0, 5);

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-locaposty-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If there are no locations, show the NoPostLocationsState component
  if (!hasLocations && !loading) {
    return (
      <DashboardLayout>
        <NoPostLocationsState />
      </DashboardLayout>
    );
  }

  // If there's an error, show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center h-[80vh]">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col h-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-locaposty-text-dark">
              Content Calendar
            </h1>
            <p className="text-locaposty-text-medium">
              Manage and schedule your Google Business Profile posts
            </p>
          </div>
          <Button
            onClick={handleCreatePost}
            size="sm"
            className="bg-locaposty-primary hover:bg-locaposty-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Tabs
                defaultValue={view}
                onValueChange={(v) => setView(v as "month" | "week" | "list")}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="month">
                    <LayoutGrid className="h-4 w-4 mr-2" /> Month
                  </TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" /> List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center ml-0 sm:ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="mx-2 font-medium">
                  {format(currentDate, "MMMM yyyy")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Location
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocationFilter === "all"}
                    onCheckedChange={() => setSelectedLocationFilter("all")}
                  >
                    All Locations
                  </DropdownMenuCheckboxItem>
                  {locations.map((location) => (
                    <DropdownMenuCheckboxItem
                      key={location.id}
                      checked={selectedLocationFilter === location.id}
                      onCheckedChange={() =>
                        setSelectedLocationFilter(location.id)
                      }
                    >
                      {location.gmbLocationName}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Tag className="mr-2 h-4 w-4" /> Post Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypeFilters.includes("WHATS_NEW")}
                    onCheckedChange={() => {
                      setSelectedTypeFilters((prev) =>
                        prev.includes("WHATS_NEW")
                          ? prev.filter((type) => type !== "WHATS_NEW")
                          : [...prev, "WHATS_NEW"]
                      );
                    }}
                  >
                    What&apos;s New
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypeFilters.includes("EVENT")}
                    onCheckedChange={() => {
                      setSelectedTypeFilters((prev) =>
                        prev.includes("EVENT")
                          ? prev.filter((type) => type !== "EVENT")
                          : [...prev, "EVENT"]
                      );
                    }}
                  >
                    Event
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypeFilters.includes("OFFER")}
                    onCheckedChange={() => {
                      setSelectedTypeFilters((prev) =>
                        prev.includes("OFFER")
                          ? prev.filter((type) => type !== "OFFER")
                          : [...prev, "OFFER"]
                      );
                    }}
                  >
                    Offer
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
                    <Tag className="mr-2 h-4 w-4" /> Post Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatusFilters.includes("DRAFT")}
                    onCheckedChange={() => {
                      setSelectedStatusFilters((prev) =>
                        prev.includes("DRAFT")
                          ? prev.filter((status) => status !== "DRAFT")
                          : [...prev, "DRAFT"]
                      );
                    }}
                  >
                    Draft
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatusFilters.includes("SCHEDULED")}
                    onCheckedChange={() => {
                      setSelectedStatusFilters((prev) =>
                        prev.includes("SCHEDULED")
                          ? prev.filter((status) => status !== "SCHEDULED")
                          : [...prev, "SCHEDULED"]
                      );
                    }}
                  >
                    Scheduled
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatusFilters.includes("PUBLISHED")}
                    onCheckedChange={() => {
                      setSelectedStatusFilters((prev) =>
                        prev.includes("PUBLISHED")
                          ? prev.filter((status) => status !== "PUBLISHED")
                          : [...prev, "PUBLISHED"]
                      );
                    }}
                  >
                    Published
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatusFilters.includes("FAILED")}
                    onCheckedChange={() => {
                      setSelectedStatusFilters((prev) =>
                        prev.includes("FAILED")
                          ? prev.filter((status) => status !== "FAILED")
                          : [...prev, "FAILED"]
                      );
                    }}
                  >
                    Failed
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:min-h-[500px]">
          {view === "month" || view === "week" ? (
            <CalendarGrid
              currentDate={currentDate}
              posts={filteredPosts}
              onSelectPost={togglePostSelection}
              selectedPosts={selectedPosts}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onPublishNow={handlePublishNow}
              publishingIds={publishingPostIds}
            />
          ) : (
            <CalendarListView
              currentDate={currentDate}
              posts={filteredPosts}
              onSelectPost={togglePostSelection}
              selectedPosts={selectedPosts}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onPublishNow={handlePublishNow}
              publishingIds={publishingPostIds}
            />
          )}

          {showSidePanel && (
            <CalendarSidePanel
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              upcomingPosts={upcomingPosts}
              toggleSidePanel={toggleSidePanel}
              onSelectPost={(postId) => {
                // Find the post to get its scheduled date
                const post = posts.find((p) => p.id === postId);
                if (post) {
                  // Set the calendar date to the post's scheduled date
                  setCurrentDate(new Date(post.scheduledAt));
                  // Select the post
                  if (!selectedPosts.includes(postId)) {
                    togglePostSelection(postId);
                  }
                }
              }}
            />
          )}
        </div>

        {/* Modal for creating/editing posts */}
        {isCreateModalOpen && (
          <CreatePostModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            locations={locations}
            onPostCreated={(newPost) => {
              // Add the new post to the posts array
              setPosts((prev) => [newPost as Post, ...prev]);
              toast.success("Post created successfully");
            }}
          />
        )}

        {isEditModalOpen && currentEditPost && (
          <CreatePostModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setCurrentEditPost(null);
            }}
            locations={locations}
            editPostId={currentEditPost}
            post={posts.find((p) => p.id === currentEditPost)}
            onPostUpdated={(updatedPost) => {
              // Update the post in the posts array
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === updatedPost.id ? (updatedPost as Post) : p
                )
              );
              toast.success("Post updated successfully");
            }}
          />
        )}

        {/* Bulk Operations Panel */}
        {selectedPosts.length > 0 && (
          <BulkOperationsPanel
            selectedCount={selectedPosts.length}
            onClearSelection={clearSelection}
            onBulkDelete={handleBulkDelete}
            onBulkPublish={handleBulkPublish}
            isPublishing={publishingPostIds.length > 0}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
