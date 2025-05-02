import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import PostItem from "./PostItem";
import { Loader2 } from "lucide-react";

// Define Post type based on Prisma schema
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

interface CalendarGridProps {
  currentDate: Date;
  posts: Post[];
  onSelectPost: (postId: string) => void;
  selectedPosts: string[];
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onPublishNow?: (postId: string) => void;
  onFetchPosts?: () => Promise<void>;
  isLoading?: boolean;
  publishingIds?: string[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  posts,
  onSelectPost,
  selectedPosts,
  onEditPost,
  onDeletePost,
  onPublishNow,
  onFetchPosts,
  isLoading = false,
  publishingIds,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [visiblePostCounts, setVisiblePostCounts] = useState<
    Record<string, boolean>
  >({});

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Auto-refresh posts status every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (onFetchPosts) {
        setRefreshing(true);
        await onFetchPosts();
        setTimeout(() => {
          setRefreshing(false);
        }, 500);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [onFetchPosts]);

  // Get day names for the header (Sun, Mon, Tue, etc.)
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Toggle visibility of all posts for a day
  const toggleAllPosts = (dayKey: string) => {
    setVisiblePostCounts((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const getPostsForDay = (day: Date) => {
    return posts.filter((post) => isSameDay(new Date(post.scheduledAt), day));
  };

  // Get posts and group by status for a given day
  const getPostsByStatus = (day: Date) => {
    const postsForDay = getPostsForDay(day);
    return {
      all: postsForDay,
      published: postsForDay.filter((post) => post.status === "PUBLISHED"),
      scheduled: postsForDay.filter((post) => post.status === "SCHEDULED"),
      draft: postsForDay.filter((post) => post.status === "DRAFT"),
      failed: postsForDay.filter((post) => post.status === "FAILED"),
    };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm h-full overflow-hidden flex flex-col relative">
      {(isLoading || refreshing) && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center bg-white bg-opacity-80 rounded-full px-2 py-1 text-xs text-gray-600 shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            {refreshing ? "Refreshing..." : "Loading..."}
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="font-semibold p-2 text-sm text-center bg-white"
          >
            <span className="md:hidden">{day.substring(0, 1)}</span>
            <span className="hidden md:inline">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>

      <div className="flex-grow grid grid-cols-7 auto-rows-fr gap-px bg-gray-100 overflow-auto">
        {days.map((day, i) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const postGroups = getPostsByStatus(day);
          const showAllPosts = visiblePostCounts[dayKey];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isPastDate = isBefore(day, new Date()) && !isToday(day);

          // Determine how many posts to show
          const postsToShow = showAllPosts
            ? postGroups.all
            : postGroups.all.slice(0, 3);

          return (
            <div
              key={i}
              className={cn(
                "bg-white p-1 min-h-[100px] flex flex-col",
                !isCurrentMonth && "opacity-50",
                isToday(day) && "ring-1 ring-locaposty-primary",
                isPastDate && "bg-gray-50"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <div
                  className={cn(
                    "text-sm font-medium p-1 rounded-full w-8 h-8 flex items-center justify-center",
                    isToday(day) && "bg-locaposty-primary text-white"
                  )}
                >
                  {format(day, "d")}
                </div>

                {postGroups.all.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {postGroups.published.length > 0 && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-green-500"
                        title={`${postGroups.published.length} published`}
                      />
                    )}
                    {postGroups.scheduled.length > 0 && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-blue-500"
                        title={`${postGroups.scheduled.length} scheduled`}
                      />
                    )}
                    {postGroups.draft.length > 0 && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-gray-400"
                        title={`${postGroups.draft.length} draft`}
                      />
                    )}
                    {postGroups.failed.length > 0 && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-red-500"
                        title={`${postGroups.failed.length} failed`}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-y-auto flex-grow space-y-1">
                {postsToShow.length > 0
                  ? postsToShow.map((post) => (
                      <PostItem
                        key={post.id}
                        post={post}
                        isSelected={selectedPosts.includes(post.id)}
                        onSelect={() => onSelectPost(post.id)}
                        view="calendar"
                        onEdit={onEditPost}
                        onDelete={onDeletePost}
                        onPublishNow={onPublishNow}
                        publishingIds={publishingIds}
                      />
                    ))
                  : isCurrentMonth && (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        No posts
                      </div>
                    )}

                {!showAllPosts && postGroups.all.length > 3 && (
                  <button
                    className="text-xs text-center bg-gray-50 hover:bg-gray-100 rounded p-1 cursor-pointer w-full transition-colors"
                    onClick={() => toggleAllPosts(dayKey)}
                  >
                    +{postGroups.all.length - 3} more
                  </button>
                )}

                {showAllPosts && postGroups.all.length > 3 && (
                  <button
                    className="text-xs text-center bg-gray-100 hover:bg-gray-200 rounded p-1 cursor-pointer w-full transition-colors"
                    onClick={() => toggleAllPosts(dayKey)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
