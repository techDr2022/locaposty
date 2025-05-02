import React from "react";
import {
  Calendar,
  Edit,
  Trash2,
  Copy,
  Image,
  Tag,
  MapPin,
  Plus,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

interface UpcomingPostsProps {
  className?: string;
  posts?: Post[];
}

const UpcomingPosts: React.FC<UpcomingPostsProps> = ({
  className = "",
  posts = [],
}) => {
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  // Function to get post type styles
  const getPostTypeStyles = (type: string) => {
    switch (type) {
      case "offer":
        return {
          bg: "bg-orange-100",
          text: "text-orange-800",
          icon: Tag,
        };
      case "event":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          icon: CalendarIcon,
        };
      default:
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          icon: Edit,
        };
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-locaposty-text-dark">
          Upcoming Posts
        </h2>
        <Link href="/posts">
          <Button
            variant="outline"
            size="sm"
            className="text-locaposty-primary"
          >
            <Calendar size={16} className="mr-1" />
            View Calendar
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Info className="h-6 w-6 text-locaposty-primary" />
          </div>
          <h3 className="text-locaposty-text-dark font-medium mb-2">
            No upcoming posts
          </h3>
          <p className="text-locaposty-text-medium text-sm mb-4 max-w-md mx-auto">
            Schedule posts to appear on your Google Business Profile to keep
            customers updated about your business.
          </p>
          <Link href="/posts/new">
            <Button
              size="sm"
              className="bg-locaposty-primary hover:bg-locaposty-primary/90"
            >
              <Plus size={16} className="mr-1" />
              Create Your First Post
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {posts.map((post) => {
              const typeStyle = getPostTypeStyles(post.type);

              return (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4 text-center">
                      <div
                        className={`p-2 rounded-full ${typeStyle.bg} ${typeStyle.text}`}
                      >
                        <typeStyle.icon size={16} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center">
                            <span
                              className={`text-xs ${typeStyle.text} ${typeStyle.bg} px-2 py-0.5 rounded-full`}
                            >
                              {post.type === "offer"
                                ? "Offer"
                                : post.type === "event"
                                  ? "Event"
                                  : "Update"}
                            </span>
                            <span className="text-xs text-locaposty-text-medium ml-2">
                              {formatDate(post.date)}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-locaposty-text-dark mt-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-locaposty-text-medium mt-1 line-clamp-1">
                            {post.content}
                          </p>

                          <div className="flex items-center mt-2 text-xs text-locaposty-text-medium">
                            {post.hasMedia && (
                              <Image size={14} className="mr-1" />
                            )}
                            {post.hasMedia && (
                              <span className="mr-3">
                                {post.mediaCount || 1} photo
                                {post.mediaCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            <MapPin size={14} className="mr-1" />
                            <span>{post.location}</span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 ml-4">
                          <button className="text-gray-400 hover:text-locaposty-primary transition-colors">
                            <Edit size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-locaposty-primary transition-colors">
                            <Copy size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100 flex justify-between items-center">
            <Link
              href="/posts"
              className="text-sm text-locaposty-primary font-medium hover:underline"
            >
              View all scheduled posts
            </Link>
            <Link href="/posts/new">
              <Button
                size="sm"
                className="bg-locaposty-primary hover:bg-locaposty-primary/90"
              >
                <Plus size={16} className="mr-1" />
                New Post
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default UpcomingPosts;
