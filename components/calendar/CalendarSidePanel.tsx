import React from "react";
import { format } from "date-fns";
import { ChevronLeft, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

interface CalendarSidePanelProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  upcomingPosts: Post[];
  toggleSidePanel: () => void;
  onViewAllUpcoming?: () => void;
  onSelectPost?: (postId: string) => void;
}

const CalendarSidePanel: React.FC<CalendarSidePanelProps> = ({
  currentDate,
  onDateChange,
  upcomingPosts,
  toggleSidePanel,
  onViewAllUpcoming,
  onSelectPost,
}) => {
  // Function to get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "WHATS_NEW":
        return "bg-blue-100 text-blue-800";
      case "EVENT":
        return "bg-purple-100 text-purple-800";
      case "OFFER":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "DELETED":
        return "bg-gray-100 text-gray-800 opacity-70";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full md:w-72 h-full bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-sm">Calendar Navigator</h3>
        <Button variant="ghost" size="icon" onClick={toggleSidePanel}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-1">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => date && onDateChange(date)}
          className="rounded-md"
        />
      </div>

      <Separator />

      <div className="p-3 border-b border-gray-100">
        <h3 className="font-medium text-sm">Upcoming Posts</h3>
      </div>

      <ScrollArea className="flex-grow p-2">
        {upcomingPosts.length > 0 ? (
          <div className="space-y-2">
            {upcomingPosts.map((post) => (
              <div
                key={post.id}
                className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onSelectPost && onSelectPost(post.id)}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Badge className={getTypeColor(post.type)} variant="outline">
                    {post.type === "WHATS_NEW"
                      ? "What's New"
                      : post.type === "EVENT"
                        ? "Event"
                        : "Offer"}
                  </Badge>
                  <Badge
                    className={getStatusColor(post.status)}
                    variant="outline"
                  >
                    {post.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium line-clamp-2">
                  {post.title}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>{format(new Date(post.scheduledAt), "MMM d")}</span>
                  <span>{format(new Date(post.scheduledAt), "h:mm a")}</span>
                </div>
                {post.location && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {post.location.gmbLocationName}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
            <CalendarIcon className="h-8 w-8 mb-2 text-gray-300" />
            <p className="text-sm">No upcoming posts</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-gray-100">
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={onViewAllUpcoming}
        >
          View All Upcoming
        </Button>
      </div>
    </div>
  );
};

export default CalendarSidePanel;
