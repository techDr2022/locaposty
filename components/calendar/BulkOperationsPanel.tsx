import React, { useState } from "react";
import { X, Trash, Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BulkOperationsPanelProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkPublish: () => Promise<void>;
  isPublishing?: boolean;
}

const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkPublish,
  isPublishing = false,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onBulkDelete();
      toast.success(`Successfully deleted ${selectedCount} posts`);
      onClearSelection();
    } catch {
      toast.error("Failed to delete posts");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishError(null);
      await onBulkPublish();
      // The toast is now handled in the parent component's onBulkPublish function
      setIsPublishDialogOpen(false);
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : "Unknown error publishing posts"
      );
      // Toast is handled in parent component, we just keep the dialog open with error
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center justify-between w-[90%] max-w-2xl z-50">
      <div className="flex items-center">
        <span className="font-medium">{selectedCount} Selected</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected posts?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                selected posts from your Google Business Profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isPublishDialogOpen}
          onOpenChange={(open) => {
            // Only allow closing if there's no error or publishing
            if (!publishError && !isPublishing) {
              setIsPublishDialogOpen(open);
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publish Now
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              {publishError ? (
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Publishing Failed
                </AlertDialogTitle>
              ) : (
                <AlertDialogTitle>Publish selected posts now?</AlertDialogTitle>
              )}

              {publishError ? (
                <AlertDialogDescription className="space-y-3">
                  <p className="text-red-600 font-medium">{publishError}</p>
                  <p>
                    There was an error publishing your posts. This may be due
                    to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      One or more locations not properly connected to Google
                      Business Profile
                    </li>
                    <li>Expired authentication tokens</li>
                    <li>Post content that violates Google&apos;s policies</li>
                  </ul>
                </AlertDialogDescription>
              ) : (
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This will immediately publish the selected posts to your
                    Google Business Profile, regardless of their scheduled date.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
                    <strong className="font-medium">Important:</strong> Only
                    posts with status &quot;DRAFT&quot; or &quot;SCHEDULED&quot;
                    will be published. Posts with other statuses will be
                    skipped.
                  </div>
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
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="bg-blue-500 hover:bg-blue-600"
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
      </div>
    </div>
  );
};

export default BulkOperationsPanel;
