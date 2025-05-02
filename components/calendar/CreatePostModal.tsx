import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, set } from "date-fns";
import {
  Loader2,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  Info as InfoIcon,
  Upload,
  X,
  ChevronsUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import dayjs from "dayjs";

// Define Post type based on Prisma schema
type Post = {
  id: string;
  userId: string;
  content: string | null;
  mediaUrls?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  published: boolean;
  postType: string;
  title: string | null;
  eventStart: string | null;
  eventEnd: string | null;
  offerStart: string | null;
  offerEnd: string | null;
  offerCode: string | null;
  offerUrl: string | null;
  offerRedemption: string | null;
  callToAction: string | null;
  // Remove the callToActionUrl field
  // ... existing code ...
};

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  editPostId?: string;
  post?: Post;
  onPostCreated?: (post: Post) => void;
  onPostUpdated?: (post: Post) => void;
}

interface Location {
  id: string;
  name: string;
  gmbLocationName: string;
  logoUrl?: string | null;
  address?: string;
}

// Define call-to-action options
const CALL_TO_ACTION_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "BOOK", label: "Book" },
  { value: "ORDER", label: "Order" },
  { value: "SHOP", label: "Shop" },
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "CALL_NOW", label: "Call Now" },
  { value: "GET_DIRECTIONS", label: "Get Directions" },
];

const POST_TYPES = [
  { value: "WHATS_NEW", label: "What's New" },
  { value: "EVENT", label: "Event" },
  { value: "OFFER", label: "Offer" },
];

// Define Location Type component
interface MultipleLocationSelectProps {
  locations: Location[];
  selectedLocationIds: string[];
  onLocationChange: (ids: string[]) => void;
  disabled?: boolean;
}

const MultipleLocationSelect: React.FC<MultipleLocationSelectProps> = ({
  locations,
  selectedLocationIds,
  onLocationChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add a reference for the button to toggle the dropdown
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleLocation = (id: string) => {
    if (selectedLocationIds.includes(id)) {
      onLocationChange(selectedLocationIds.filter((locId) => locId !== id));
    } else {
      onLocationChange([...selectedLocationIds, id]);
    }
  };

  // Handle outside clicks - but only close from the "Done" button
  // This effectively prevents outside clicks from closing the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle outside clicks when dropdown is open
      if (!open) return;

      // If clicking on the toggle button, let the onClick handler manage it
      if (
        buttonRef.current &&
        buttonRef.current.contains(event.target as Node)
      ) {
        return;
      }

      // If clicking inside the dropdown, don't close it
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(event.target as Node)
      ) {
        // Prevent the click from closing the dropdown
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Prevent clicks outside the dropdown from closing it
      event.preventDefault();
      event.stopPropagation();
    };

    // Use the capture phase to intercept events before they reach their targets
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [open]);

  const filteredLocations = locations.filter((location) =>
    location.gmbLocationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buttonText =
    selectedLocationIds.length === 0
      ? "Select locations"
      : `${selectedLocationIds.length} location${selectedLocationIds.length > 1 ? "s" : ""} selected`;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        ref={buttonRef}
      >
        <span className="truncate">{buttonText}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border border-gray-200 bg-white shadow-lg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="p-2 border-b">
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-60 overflow-auto p-1">
            {filteredLocations.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No locations found.
              </div>
            ) : (
              filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleLocation(location.id);
                  }}
                >
                  <Checkbox
                    checked={selectedLocationIds.includes(location.id)}
                    onCheckedChange={() => {
                      toggleLocation(location.id);
                    }}
                    id={`location-${location.id}`}
                    className="cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label
                    htmlFor={`location-${location.id}`}
                    className="text-sm cursor-pointer flex-grow"
                  >
                    {location.gmbLocationName}
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t p-2">
            <div className="text-sm text-muted-foreground">
              {selectedLocationIds.length} selected
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  locations,
  editPostId,
  post,
  onPostCreated,
  onPostUpdated,
}) => {
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [callToAction, setCallToAction] = useState<string | null>("NONE");
  const [postType, setPostType] = useState<"WHATS_NEW" | "EVENT" | "OFFER">(
    "WHATS_NEW"
  );

  // Event and offer specific fields
  const [eventStart, setEventStart] = useState<Date | null>(null);
  const [eventEnd, setEventEnd] = useState<Date | null>(null);
  const [offerStart, setOfferStart] = useState<Date | null>(null);
  const [offerEnd, setOfferEnd] = useState<Date | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // Schedule fields
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    new Date()
  );
  const [scheduleTime, setScheduleTime] = useState("12:00");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openEventStartPicker, setOpenEventStartPicker] = useState(false);
  const [openEventEndPicker, setOpenEventEndPicker] = useState(false);
  const [openOfferStartPicker, setOpenOfferStartPicker] = useState(false);
  const [openOfferEndPicker, setOpenOfferEndPicker] = useState(false);

  // Initialize form with post data if editing
  useEffect(() => {
    if (post && editPostId) {
      setIsEditMode(true);
      setTitle(post.title || "");
      setContent(post.content || "");
      setLocationIds(post.locationIds || []);
      setMediaUrls(post.mediaUrls || []);
      setPostType(post.postType as "WHATS_NEW" | "EVENT" | "OFFER");
      setCallToAction(post.callToAction || "NONE");

      // Set scheduled date and time
      const scheduledDateTime = new Date(post.scheduledAt);
      setScheduleDate(scheduledDateTime);
      setScheduleTime(format(scheduledDateTime, "HH:mm"));

      // Set event details if applicable
      if (post.postType === "EVENT") {
        if (post.eventStart) setEventStart(new Date(post.eventStart));
        if (post.eventEnd) setEventEnd(new Date(post.eventEnd));
      }

      // Set offer details if applicable
      if (post.postType === "OFFER") {
        if (post.offerStart) setOfferStart(new Date(post.offerStart));
        if (post.offerEnd) setOfferEnd(new Date(post.offerEnd));
        if (post.couponCode) setCouponCode(post.couponCode);
      }
    } else {
      resetForm();
      // Set default location if available
      if (locations && locations.length > 0) {
        setLocationIds([locations[0].id]);
      }
    }
  }, [post, editPostId, locations]);

  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setLocationIds([]);
    setMediaUrls([]);
    setScheduleDate(new Date());
    setScheduleTime("12:00");
    setCallToAction("NONE");
    setPostType("WHATS_NEW");
    setEventStart(null);
    setEventEnd(null);
    setOfferStart(null);
    setOfferEnd(null);
    setCouponCode(null);
    setActiveTab("edit");
    setError(null);
    setIsEditMode(false);
  }, []);

  // Helper to combine date and time
  const combineDateTime = (
    date: Date | undefined,
    timeString: string
  ): Date => {
    if (!date) return new Date();

    const [hours, minutes] = timeString.split(":").map(Number);
    return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
  };

  // Handle submission
  const handleSubmit = async (
    asDraft: boolean = false,
    immediatePublish: boolean = false
  ) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Basic validation
      if (!title.trim()) {
        setError("Title is required");
        return;
      }
      if (!content.trim()) {
        setError("Content is required");
        return;
      }
      if (locationIds.length === 0) {
        setError("Please select at least one location");
        return;
      }

      // Combine date and time for scheduling
      const scheduledDateTime = combineDateTime(scheduleDate, scheduleTime);

      // Determine status based on parameters
      let status = "SCHEDULED";
      if (asDraft) status = "DRAFT";
      if (immediatePublish) status = "PUBLISHED";

      // If editing, update the existing post
      if (isEditMode && editPostId) {
        // Create post payload for update
        const postData = {
          id: editPostId,
          locationId: locationIds[0], // Use the first location for API compatibility
          locationIds: locationIds, // Store all selected locations
          title: title.trim(),
          content: content.trim(),
          type: postType,
          mediaUrls,
          scheduledAt: scheduledDateTime.toISOString(),
          status,
          callToAction: callToAction === "NONE" ? null : callToAction,
          ...(postType === "EVENT" && {
            eventStart: eventStart ? eventStart.toISOString() : null,
            eventEnd: eventEnd ? eventEnd.toISOString() : null,
          }),
          ...(postType === "OFFER" && {
            offerStart: offerStart ? offerStart.toISOString() : null,
            offerEnd: offerEnd ? offerEnd.toISOString() : null,
            couponCode: couponCode || null,
          }),
        };

        // Update the post
        const response = await fetch("/api/posts", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update post");
        }

        const updatedPost = await response.json();
        if (onPostUpdated) onPostUpdated(updatedPost);

        onClose();
      } else {
        // Create posts for each selected location
        const createdPosts = [];
        const errors = [];

        // Process each location
        for (const locationId of locationIds) {
          try {
            // Create post payload
            const postData = {
              locationId,
              title: title.trim(),
              content: content.trim(),
              type: postType,
              mediaUrls,
              scheduledAt: scheduledDateTime.toISOString(),
              status,
              callToAction: callToAction === "NONE" ? null : callToAction,
              ...(postType === "EVENT" && {
                eventStart: eventStart ? eventStart.toISOString() : null,
                eventEnd: eventEnd ? eventEnd.toISOString() : null,
              }),
              ...(postType === "OFFER" && {
                offerStart: offerStart ? offerStart.toISOString() : null,
                offerEnd: offerEnd ? offerEnd.toISOString() : null,
                couponCode: couponCode || null,
              }),
            };

            // Send request to API
            const response = await fetch("/api/posts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(postData),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create post");
            }

            const savedPost = await response.json();
            createdPosts.push(savedPost);
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : `Failed to create post for location ${locationId}`;
            errors.push(errorMessage);
          }
        }

        // Handle results
        if (errors.length > 0) {
          if (errors.length === locationIds.length) {
            // All posts failed
            setError(`Failed to create posts: ${errors.join(", ")}`);
            return;
          } else {
            // Some posts succeeded
            setError(
              `Created ${createdPosts.length} posts, but failed for some locations: ${errors.join(", ")}`
            );
          }
        }

        // Call callback with first post if available
        if (createdPosts.length > 0 && onPostCreated) {
          onPostCreated(createdPosts[0]);
        }

        // Close modal and reset form
        onClose();
        resetForm();
      }
    } catch (error: unknown) {
      console.error("Error saving post:", error);
      setError(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get location details
  const getLocationById = (id: string): Location | undefined => {
    return locations.find((loc) => loc.id === id);
  };

  // Get selected location details
  const selectedLocations = locationIds.map((id) => getLocationById(id));

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    // Validate file type (only allow images)
    if (!file.type.match(/image\/(jpeg|png|gif|jpg)/i)) {
      setError("Only JPEG, PNG, GIF, and JPG images are supported");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Create FormData for the API request
      const formData = new FormData();
      formData.append("file", file);

      // Send the file to the server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();

      // Update media URLs with the new one
      setMediaUrls([data.fileUrl]);
      setUploadProgress(100);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: Error | unknown) {
      console.error("Error uploading file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      setError(errorMessage);
    } finally {
      // Keep the progress bar visible for a moment so users can see it completed
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setMediaUrls([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Post" : "Create New Post"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="post-type">Post Type</Label>
              <Select
                value={postType}
                onValueChange={(value) =>
                  setPostType(value as "WHATS_NEW" | "EVENT" | "OFFER")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  {POST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locations">Locations</Label>
              <MultipleLocationSelect
                locations={locations}
                selectedLocationIds={locationIds}
                onLocationChange={setLocationIds}
                disabled={isEditMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <div className="text-xs text-gray-400 text-right">
                {title.length}/100 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your post content here..."
                className="min-h-32"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1500}
              />
              <div className="text-xs text-gray-400 text-right">
                {content.length}/1500 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Media</Label>
              <div className="border border-dashed border-gray-200 rounded-md p-4 bg-gray-50">
                {mediaUrls.length > 0 ? (
                  <div className="relative">
                    <img
                      src={mediaUrls[0]}
                      alt="Uploaded media"
                      className="w-full h-48 object-contain rounded-md"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1 text-white hover:bg-opacity-90 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <div className="text-sm text-gray-500">
                          Uploading...
                        </div>
                        <Progress
                          value={uploadProgress}
                          className="w-full h-2"
                        />
                        <div className="text-xs text-gray-400">
                          {uploadProgress}%
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <div className="text-sm text-gray-500 mb-2">
                          Drag and drop an image or click to browse
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select Image
                        </Button>
                        <div className="text-xs text-gray-400 mt-2">
                          Supports: JPEG, PNG, GIF (max 5MB)
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="call-to-action">Call to Action</Label>
              <Select
                value={callToAction || "NONE"}
                onValueChange={(value) =>
                  setCallToAction(value === "NONE" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a call to action" />
                </SelectTrigger>
                <SelectContent>
                  {CALL_TO_ACTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event specific fields */}
            {postType === "EVENT" && (
              <div className="space-y-4 border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold">Event Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="event-start">Event Start</Label>
                  <div className="flex gap-2 relative">
                    {/* Custom date picker trigger */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenEventStartPicker(!openEventStartPicker);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventStart ? (
                        format(eventStart, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>

                    <Input
                      type="time"
                      value={eventStart ? format(eventStart, "HH:mm") : ""}
                      onChange={(e) => {
                        if (eventStart) {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newDateTime = set(eventStart, {
                            hours,
                            minutes,
                          });
                          setEventStart(newDateTime);
                        } else if (e.target.value) {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newDateTime = set(new Date(), {
                            hours,
                            minutes,
                          });
                          setEventStart(newDateTime);
                        }
                      }}
                      className="w-24"
                    />

                    {/* Calendar modal with overlay */}
                    {openEventStartPicker && (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        onClick={() => setOpenEventStartPicker(false)}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-25" />
                        <div
                          className="bg-white p-2 rounded-md shadow-lg z-[10000]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar
                            mode="single"
                            selected={eventStart || undefined}
                            onSelect={(date) => {
                              if (date) {
                                setEventStart(date);
                                setOpenEventStartPicker(false);
                              }
                            }}
                            initialFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-end">Event End</Label>
                  <div className="flex gap-2 relative">
                    {/* Custom date picker trigger */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenEventEndPicker(!openEventEndPicker);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventEnd ? (
                        format(eventEnd, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>

                    <Input
                      type="time"
                      value={eventEnd ? format(eventEnd, "HH:mm") : ""}
                      onChange={(e) => {
                        if (eventEnd) {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newDateTime = set(eventEnd, { hours, minutes });
                          setEventEnd(newDateTime);
                        } else if (e.target.value) {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newDateTime = set(new Date(), {
                            hours,
                            minutes,
                          });
                          setEventEnd(newDateTime);
                        }
                      }}
                      className="w-24"
                    />

                    {/* Calendar modal with overlay */}
                    {openEventEndPicker && (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        onClick={() => setOpenEventEndPicker(false)}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-25" />
                        <div
                          className="bg-white p-2 rounded-md shadow-lg z-[10000]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar
                            mode="single"
                            selected={eventEnd || undefined}
                            onSelect={(date) => {
                              if (date) {
                                setEventEnd(date);
                                setOpenEventEndPicker(false);
                              }
                            }}
                            initialFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Offer specific fields */}
            {postType === "OFFER" && (
              <div className="space-y-4 border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold">Offer Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="offer-start">Offer Start Date</Label>
                  <div className="relative">
                    {/* Custom date picker trigger */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenOfferStartPicker(!openOfferStartPicker);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {offerStart ? (
                        format(offerStart, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>

                    {/* Calendar modal with overlay */}
                    {openOfferStartPicker && (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        onClick={() => setOpenOfferStartPicker(false)}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-25" />
                        <div
                          className="bg-white p-2 rounded-md shadow-lg z-[10000]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar
                            mode="single"
                            selected={offerStart || undefined}
                            onSelect={(date) => {
                              if (date) {
                                setOfferStart(date);
                                setOpenOfferStartPicker(false);
                              }
                            }}
                            initialFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer-end">Offer End Date</Label>
                  <div className="relative">
                    {/* Custom date picker trigger */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenOfferEndPicker(!openOfferEndPicker);
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {offerEnd ? (
                        format(offerEnd, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>

                    {/* Calendar modal with overlay */}
                    {openOfferEndPicker && (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        onClick={() => setOpenOfferEndPicker(false)}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-25" />
                        <div
                          className="bg-white p-2 rounded-md shadow-lg z-[10000]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar
                            mode="single"
                            selected={offerEnd || undefined}
                            onSelect={(date) => {
                              if (date) {
                                setOfferEnd(date);
                                setOpenOfferEndPicker(false);
                              }
                            }}
                            initialFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-code">Coupon Code (Optional)</Label>
                  <Input
                    id="coupon-code"
                    placeholder="Enter coupon code"
                    value={couponCode || ""}
                    onChange={(e) => setCouponCode(e.target.value || null)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="schedule-date">Schedule For</Label>
                {!isEditMode && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => {
                      setScheduleDate(new Date());
                      setScheduleTime(format(new Date(), "HH:mm"));
                    }}
                  >
                    Set to now
                  </button>
                )}
              </div>
              <div className="flex gap-2 relative">
                {/* Custom date picker trigger */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDatePicker(!openDatePicker);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduleDate ? (
                    format(scheduleDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>

                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-24"
                />

                {/* Calendar modal with overlay */}
                {openDatePicker && (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    onClick={() => setOpenDatePicker(false)}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-25" />
                    <div
                      className="bg-white p-2 rounded-md shadow-lg z-[10000]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={(date) => {
                          if (date) {
                            setScheduleDate(date);
                            setOpenDatePicker(false);
                          }
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="py-2">
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-sm">
                    {selectedLocations
                      .map((loc) => loc?.gmbLocationName)
                      .join(", ")}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {scheduleDate
                      ? format(
                          combineDateTime(scheduleDate, scheduleTime),
                          "MMM d, yyyy 'at' h:mm a"
                        )
                      : "Scheduled date"}
                  </div>
                </div>

                {/* Image at the top */}
                {mediaUrls.length > 0 && (
                  <div className="w-full">
                    <img
                      src={mediaUrls[0]}
                      alt="Post media"
                      className="rounded-md object-cover w-full h-48"
                    />
                  </div>
                )}

                {/* Content below the image */}
                <p className="text-sm whitespace-pre-wrap">
                  {content || "Post content will appear here..."}
                </p>

                {callToAction && callToAction !== "NONE" && (
                  <Button className="w-full bg-locaposty-primary">
                    {
                      CALL_TO_ACTION_OPTIONS.find(
                        (opt) => opt.value === callToAction
                      )?.label
                    }
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex items-center gap-1">
              <InfoIcon className="h-4 w-4" />
              <span>
                This is a preview of how your post may look. The actual
                appearance on Google Business Profile may vary.
              </span>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 flex-wrap sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true, false)}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(false, true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Now"
              )}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false, false)}
              disabled={isSubmitting}
              className="bg-locaposty-primary hover:bg-locaposty-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Schedule Post"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
