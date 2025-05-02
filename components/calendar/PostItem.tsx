import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MessageSquare,
  Tag,
  MapPin,
  Edit,
  Trash,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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

interface PostItemProps {
  post: Post;
  isSelected: boolean;
  onSelect: () => void;
  view: "calendar" | "list";
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPublishNow?: (postId: string) => void;
  publishingIds?: string[];
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  isSelected,
  onSelect,
  view,
  onEdit,
  onDelete,
  onPublishNow,
  publishingIds = [],
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "WHATS_NEW":
        return <MessageSquare className="h-3 w-3" />;
      case "EVENT":
        return <Calendar className="h-3 w-3" />;
      case "OFFER":
        return <Tag className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "WHATS_NEW":
        return "What&apos;s New";
      case "EVENT":
        return "Event";
      case "OFFER":
        return "Offer";
      default:
        return type;
    }
  };

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

  const formatDate = (date: string | Date) => {
    return typeof date === "string" ? new Date(date) : date;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(post.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (onDelete) {
      try {
        onDelete(post.id);
        toast.success("Post deleted successfully");
      } catch (error: unknown) {
        console.error("Delete error:", error);
        toast.error("Failed to delete post");
      }
    }
    setIsDeleteDialogOpen(false);
  };

  const handlePublishNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.status === "SCHEDULED" || post.status === "DRAFT") {
      setPublishError(null);
      setIsPublishDialogOpen(true);
    } else {
      toast.error("Only scheduled or draft posts can be published immediately");
    }
  };

  const confirmPublish = async () => {
    if (onPublishNow) {
      try {
        setPublishError(null);
        await onPublishNow(post.id);
        toast.success("Post published successfully");
        setIsPublishDialogOpen(false);
      } catch (error: unknown) {
        console.error("Publish error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to publish post";
        setPublishError(errorMessage);
        // Don't close the dialog so user can see the error
      }
    }
  };

  const isPublishing = publishingIds.includes(post.id);

  if (view === "calendar") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "text-xs border rounded p-1 cursor-pointer flex items-start gap-1 hover:shadow-sm transition-shadow",
                post.status === "PUBLISHED"
                  ? "border-green-300 bg-green-50"
                  : post.status === "SCHEDULED"
                    ? "border-blue-300 bg-blue-50"
                    : post.status === "FAILED"
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white",
                isSelected && "ring-2 ring-blue-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Checkbox checked={isSelected} className="h-3 w-3" />
              </div>
              <div className="flex-grow min-w-0 space-y-0.5">
                <div className="font-medium truncate">{post.title}</div>
                <div className="flex items-center text-[10px] opacity-80">
                  <Clock className="h-2 w-2 mr-1" />
                  {format(formatDate(post.scheduledAt), "h:mm a")}
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      className="p-0.5 rounded-sm hover:bg-gray-200 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) onEdit(post.id);
                      }}
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </button>
                    {(post.status === "SCHEDULED" ||
                      post.status === "DRAFT") && (
                      <button
                        className={`p-0.5 rounded-sm ${isPublishing ? "bg-blue-100" : "hover:bg-gray-200"} text-blue-600`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPublishing && onPublishNow) {
                            handlePublishNowClick(e);
                          }
                        }}
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Send className="h-2.5 w-2.5" />
                        )}
                      </button>
                    )}
                    <button
                      className="p-0.5 rounded-sm hover:bg-gray-200 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e);
                      }}
                    >
                      <Trash className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 mt-1 ml-0.5",
                  post.status === "PUBLISHED"
                    ? "bg-green-500"
                    : post.status === "SCHEDULED"
                      ? "bg-blue-500"
                      : post.status === "FAILED"
                        ? "bg-red-500"
                        : "bg-gray-400"
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-xs">
              <div className="flex items-center gap-1">
                <Badge className={getTypeColor(post.type)}>
                  {getTypeIcon(post.type)}
                  <span className="ml-1">{getTypeLabel(post.type)}</span>
                </Badge>
                <Badge className={getStatusColor(post.status)}>
                  {post.status}
                </Badge>
              </div>
              <div className="font-medium">{post.title}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(formatDate(post.scheduledAt), "h:mm a")}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {post.location?.gmbLocationName || "Unknown Location"}
                </span>
              </div>
              <div className="text-xs">
                {post.content.length > 100
                  ? post.content.substring(0, 100) + "..."
                  : post.content}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative bg-white rounded-md border p-3 hover:shadow-sm cursor-pointer transition-shadow",
          isSelected && "ring-2 ring-blue-500"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className="absolute top-3 right-3">
          <Checkbox checked={isSelected} />
        </div>

        <div className="space-y-2 pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getTypeColor(post.type)}>
              {getTypeIcon(post.type)}
              <span className="ml-1">{getTypeLabel(post.type)}</span>
            </Badge>
            <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
          </div>

          <h4 className="font-medium">{post.title}</h4>

          <div className="text-sm text-gray-600 line-clamp-2">
            {post.content}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(formatDate(post.scheduledAt), "h:mm a")}
            </span>
            <span className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {post.location?.gmbLocationName || "Unknown Location"}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 rounded-md hover:bg-gray-100"
                    onClick={handleEditClick}
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(post.status === "SCHEDULED" || post.status === "DRAFT") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="p-1 rounded-md hover:bg-gray-100"
                      onClick={handlePublishNowClick}
                      disabled={isPublishing}
                    >
                      {isPublishing ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 text-blue-500" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Publish Now</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 rounded-md hover:bg-gray-100"
                    onClick={handleDeleteClick}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Now Confirmation Dialog */}
      <AlertDialog
        open={isPublishDialogOpen}
        onOpenChange={(open) => {
          // Only allow closing if there's no error or we're not publishing
          if (!publishError && !isPublishing) {
            setIsPublishDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            {publishError ? (
              <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Publishing Failed
              </AlertDialogTitle>
            ) : (
              <AlertDialogTitle>Publish this post now?</AlertDialogTitle>
            )}

            {publishError ? (
              <AlertDialogDescription className="space-y-3">
                <p className="text-red-600 font-medium">{publishError}</p>
                <p>
                  There was an error publishing your post. This could be due to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {publishError.includes("location") && (
                    <li className="text-amber-600 font-medium">
                      The location is not properly connected to Google Business
                      Profile
                    </li>
                  )}
                  {publishError.includes("auth") && (
                    <li className="text-amber-600 font-medium">
                      Your Google authentication has expired or is invalid
                    </li>
                  )}
                  {!publishError.includes("location") &&
                    !publishError.includes("auth") && (
                      <>
                        <li>
                          The location may not be properly connected to Google
                          Business Profile
                        </li>
                        <li>Your Google authentication may have expired</li>
                        <li>
                          The post content may violate Google&apos;s policies
                        </li>
                      </>
                    )}
                </ul>
                <p className="text-sm mt-4 bg-gray-50 p-2 rounded border border-gray-200">
                  <strong>What to do next:</strong> Try reconnecting your
                  location in settings or modifying the post content. Visit the
                  Locations page to check connection status.
                </p>
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                This will immediately publish the post to your Google Business
                Profile.
                {post.type === "EVENT" && (
                  <p className="mt-2 text-amber-600">
                    This post is an <strong>Event</strong> - make sure all event
                    details are correct before publishing.
                  </p>
                )}
                {post.type === "OFFER" && (
                  <p className="mt-2 text-amber-600">
                    This post is an <strong>Offer</strong> - make sure all offer
                    details like dates and coupon codes are correct.
                  </p>
                )}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {publishError ? (
              <>
                <AlertDialogCancel onClick={() => setPublishError(null)}>
                  Try Again
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setPublishError(null);
                    setIsPublishDialogOpen(false);
                  }}
                >
                  Close
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel disabled={isPublishing}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmPublish}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </div>
                  ) : (
                    "Publish Now"
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostItem;
