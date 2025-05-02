"use client";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Star,
  Flag,
  Clock,
  MoreHorizontal,
  Send,
  Copy,
  Bot,
  RefreshCw,
  User,
  Edit2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import ReviewStatusBadge from "./ReviewStatusBadge";

// Review interface based on the Prisma schema
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

interface ReviewDetailProps {
  review: Review;
  onSendReply: (reviewId: string, replyContent: string, tone: string) => void;
  onUpdateStatus: (reviewId: string, newStatus: string) => void;
  aiSuggestions: {
    positive: string[];
    neutral: string[];
    negative: string[];
  };
  aiTemplates: {
    id: string;
    name: string;
    content: string;
    tone: string;
  }[];
}

const ReviewDetail: React.FC<ReviewDetailProps> = ({
  review,
  onSendReply,
  onUpdateStatus,
  aiSuggestions,
  aiTemplates,
}) => {
  const [replyContent, setReplyContent] = useState("");
  const [selectedTone, setSelectedTone] = useState<string>("FRIENDLY");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [characterCount, setCharacterCount] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const MAX_CHARACTERS = 1000;

  // Get latest reply if available
  const latestReply = review.replies.length > 0 ? review.replies[0] : null;

  useEffect(() => {
    setCharacterCount(replyContent.length);
  }, [replyContent]);

  useEffect(() => {
    // Reset editing state when review changes
    setIsEditing(false);
    setEditingReplyId(null);

    // If there's a latest reply, use its content
    if (latestReply) {
      setReplyContent(latestReply.content);
      setSelectedTone(latestReply.tone);
    } else {
      // Auto-generate AI reply suggestion based on sentiment
      const sentimentLower = review.sentiment?.toLowerCase() || "neutral";
      const suggestions =
        sentimentLower === "positive"
          ? aiSuggestions.positive
          : sentimentLower === "neutral"
            ? aiSuggestions.neutral
            : aiSuggestions.negative;

      setReplyContent(suggestions[0] || "");
    }
  }, [review, aiSuggestions, latestReply]);

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onSendReply(review.id, replyContent, selectedTone);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = aiTemplates.find((t) => t.id === templateId);
    if (template) {
      setReplyContent(template.content);
      setSelectedTone(template.tone);
    }
    setSelectedTemplate(templateId);
  };

  const handleGenerateAIReply = async () => {
    setIsGeneratingAI(true);
    try {
      // Call the AI generation API endpoint
      const response = await fetch("/api/reviews/ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: review.id,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI reply");
      }

      const data = await response.json();

      // Update the reply content with the AI-generated response
      setReplyContent(data.reply.content);
      setSelectedTone(data.reply.tone);

      toast.success("AI response generated!", {
        description:
          "The AI has created a new response based on your preferences.",
      });
    } catch (error) {
      console.error("Error generating AI reply:", error);
      toast.error("Failed to generate AI response", {
        description: "Please try again or create a manual response.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleStartEditing = (
    replyId: string,
    content: string,
    tone: string
  ) => {
    setIsEditing(true);
    setEditingReplyId(replyId);
    setReplyContent(content);
    setSelectedTone(tone);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditingReplyId(null);

    // Restore original content or set to latest reply content
    if (latestReply) {
      setReplyContent(latestReply.content);
      setSelectedTone(latestReply.tone);
    }
  };

  const handlePublishReply = async () => {
    if (!editingReplyId || !replyContent.trim()) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/reviews/reply/${editingReplyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish reply");
      }

      // Reset editing state
      setIsEditing(false);
      setEditingReplyId(null);

      // Show success toast
      toast.success("Reply published successfully!", {
        description:
          "Your updated response has been posted to Google Business Profile.",
      });

      // Refresh the review data
      onSendReply("refresh", "", "");
    } catch (error) {
      console.error("Error publishing reply:", error);
      toast.error("Failed to publish reply", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    if (!sentiment) return "bg-gray-100 text-gray-800 border-gray-200";

    const sentimentLower = sentiment.toLowerCase();
    return sentimentLower === "positive"
      ? "bg-green-100 text-green-800 border-green-200"
      : sentimentLower === "neutral"
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-red-100 text-red-800 border-red-200";
  };

  const isReplied = review.replies.some((reply) => reply.isPublished);

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 mr-3">
                {review.authorPhoto ? (
                  <img
                    src={review.authorPhoto}
                    alt={review.authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{review.authorName}</CardTitle>
                <CardDescription>
                  {format(new Date(review.createTime), "MMMM d, yyyy, h:mm a")}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getSentimentColor(review.sentiment)}`}
              >
                {review.sentiment
                  ? review.sentiment.charAt(0).toUpperCase() +
                    review.sentiment.slice(1).toLowerCase()
                  : "Unknown"}
              </Badge>

              {review.isProcessed !== undefined && (
                <div className="absolute top-0 right-0 mt-2 mr-2">
                  <Badge
                    variant="outline"
                    className={`${review.isProcessed ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}
                  >
                    {review.isProcessed ? (
                      <>
                        <Bot className="mr-1 h-3 w-3" /> AI Processed
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1 h-3 w-3" /> Pending AI
                      </>
                    )}
                  </Badge>
                </div>
              )}

              <ReviewStatusBadge
                status={review.status}
                replySource={latestReply?.source}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(review.id, "pending")}
                  >
                    <Clock className="mr-2 h-4 w-4" /> Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(review.id, "flagged")}
                  >
                    <Flag className="mr-2 h-4 w-4" /> Flag for Attention
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(review.comment || "");
                      toast.success("Review copied to clipboard");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Review Text
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center my-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                className={
                  i < review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            {review.comment || "No comment provided"}
          </p>
        </CardContent>
      </Card>

      <Card className="flex-grow overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Response</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Edit your response to this review"
                  : isReplied
                    ? "Your response to this review"
                    : "Draft a response to this review"}
              </CardDescription>
            </div>
            {latestReply && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() =>
                  handleStartEditing(
                    latestReply.id,
                    latestReply.content,
                    latestReply.tone
                  )
                }
              >
                <Edit2 className="mr-2 h-4 w-4" /> Edit Reply
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestReply && !isEditing && (
            <div
              className="flex flex-col space-y-1 p-3 rounded-md mb-4"
              style={{
                backgroundColor:
                  latestReply.source === "AUTO_POSTED"
                    ? "rgba(37, 99, 235, 0.05)"
                    : latestReply.source === "AI_GENERATED"
                      ? "rgba(245, 158, 11, 0.05)"
                      : "rgba(16, 185, 129, 0.05)",
              }}
            >
              <div className="flex items-center">
                {latestReply.source === "AUTO_POSTED" ? (
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                ) : latestReply.source === "AI_GENERATED" ? (
                  <Bot className="h-5 w-5 mr-2 text-amber-600" />
                ) : (
                  <User className="h-5 w-5 mr-2 text-emerald-600" />
                )}
                <span className="font-medium">
                  {latestReply.source === "AUTO_POSTED"
                    ? "Auto-posted AI reply"
                    : latestReply.source === "AI_GENERATED"
                      ? "AI-generated reply (pending approval)"
                      : "Manual reply"}
                </span>
              </div>
              <p className="text-sm ml-7 text-gray-600">
                {latestReply.content}
              </p>
              <p className="text-xs ml-7 text-gray-500">
                {latestReply.source === "AUTO_POSTED"
                  ? "This reply was automatically generated and posted by the auto-reply system based on your settings."
                  : latestReply.source === "AI_GENERATED"
                    ? "This reply was generated by AI and is waiting for your review before posting."
                    : "This reply was manually composed and posted by a team member."}
              </p>
              {latestReply.publishedAt && (
                <p className="text-xs ml-7 text-gray-500">
                  Posted on{" "}
                  {format(
                    new Date(latestReply.publishedAt),
                    "MMMM d, yyyy, h:mm a"
                  )}
                </p>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div className="bg-blue-50 px-3 py-2 rounded-md text-sm text-blue-800 mb-2">
                <p>
                  You are editing your reply. Make your changes and click
                  &ldquo;Publish Reply&rdquo; to update your response on Google
                  Business Profile.
                </p>
              </div>

              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Edit your response here..."
                className="min-h-[150px] text-base"
              />

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRIENDLY">Friendly</SelectItem>
                      <SelectItem value="FORMAL">Formal</SelectItem>
                      <SelectItem value="APOLOGETIC">Apologetic</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={handleGenerateAIReply}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    {isGeneratingAI ? "Generating..." : "Generate AI Reply"}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  {characterCount}/{MAX_CHARACTERS} characters
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelEditing}
                  className="flex items-center"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button
                  onClick={handlePublishReply}
                  disabled={
                    !replyContent.trim() ||
                    characterCount > MAX_CHARACTERS ||
                    isPublishing
                  }
                  className="flex items-center bg-locaposty-primary hover:bg-locaposty-primary/80 text-white"
                >
                  {isPublishing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isPublishing ? "Publishing..." : "Publish Reply"}
                </Button>
              </div>
            </div>
          ) : (
            <Tabs
              defaultValue="compose"
              className={`w-full ${isReplied ? "hidden" : ""}`}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="compose">Compose Reply</TabsTrigger>
                <TabsTrigger value="templates">
                  AI Templates{" "}
                  <Bot className="h-4 w-4 ml-1 text-locaposty-primary" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="compose" className="space-y-4">
                <div className="space-y-4">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your response here..."
                    className="min-h-[150px] text-base"
                    disabled={isReplied}
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedTone}
                        onValueChange={setSelectedTone}
                        disabled={isReplied}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FRIENDLY">Friendly</SelectItem>
                          <SelectItem value="FORMAL">Formal</SelectItem>
                          <SelectItem value="APOLOGETIC">Apologetic</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={handleGenerateAIReply}
                        disabled={isReplied || isGeneratingAI}
                      >
                        {isGeneratingAI ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Bot className="mr-2 h-4 w-4" />
                        )}
                        {isGeneratingAI ? "Generating..." : "Generate AI Reply"}
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {characterCount}/{MAX_CHARACTERS} characters
                    </div>
                  </div>
                </div>

                {!isReplied && (
                  <Button
                    onClick={handleSendReply}
                    className="w-full"
                    disabled={
                      !replyContent.trim() || characterCount > MAX_CHARACTERS
                    }
                  >
                    <Send className="mr-2 h-4 w-4" /> Send Reply
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="templates">
                <div className="grid gap-4">
                  {aiTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedTemplate === template.id ? "border-locaposty-primary bg-blue-50" : ""}`}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline">{template.tone}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectTemplate(template.id)}
                          >
                            Use Template
                          </Button>
                        </div>
                        <p className="text-sm">{template.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewDetail;
