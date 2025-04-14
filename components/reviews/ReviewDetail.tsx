"use client";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ReviewType } from "@/data/mockReviewsData";
import {
  Star,
  Flag,
  CheckCircle,
  Clock,
  MessageSquare,
  MoreHorizontal,
  Send,
  Copy,
  ThumbsUp,
  AlertTriangle,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

interface ReviewDetailProps {
  review: ReviewType;
  onSendReply: (reviewId: string, replyContent: string) => void;
  onUpdateStatus: (
    reviewId: string,
    newStatus: "pending" | "replied" | "flagged"
  ) => void;
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
  const [selectedTone, setSelectedTone] = useState<string>("friendly");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [characterCount, setCharacterCount] = useState(0);

  const MAX_CHARACTERS = 1000;

  useEffect(() => {
    setCharacterCount(replyContent.length);
  }, [replyContent]);

  useEffect(() => {
    // Auto-generate AI reply suggestion based on sentiment
    if (!review.replyContent) {
      const suggestions =
        review.sentiment === "positive"
          ? aiSuggestions.positive
          : review.sentiment === "neutral"
          ? aiSuggestions.neutral
          : aiSuggestions.negative;

      setReplyContent(suggestions[0] || "");
    } else {
      setReplyContent(review.replyContent);
    }
  }, [review, aiSuggestions]);

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onSendReply(review.id, replyContent);
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

  const handleGenerateAIReply = () => {
    const suggestions =
      review.sentiment === "positive"
        ? aiSuggestions.positive
        : review.sentiment === "neutral"
        ? aiSuggestions.neutral
        : aiSuggestions.negative;

    const randomIndex = Math.floor(Math.random() * suggestions.length);
    setReplyContent(suggestions[randomIndex]);

    toast.success("AI response generated!", {
      description:
        "The AI has created a new response based on your preferences.",
    });
  };

  const getSentimentColor = (sentiment: string) => {
    return sentiment === "positive"
      ? "bg-green-100 text-green-800 border-green-200"
      : sentiment === "neutral"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "replied":
        return <CheckCircle size={14} className="mr-1" />;
      case "pending":
        return <Clock size={14} className="mr-1" />;
      case "flagged":
        return <Flag size={14} className="mr-1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "replied":
        return "bg-green-50 text-green-600 border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "flagged":
        return "bg-red-50 text-red-600 border-red-200";
    }
  };

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
                  {format(new Date(review.date), "MMMM d, yyyy, h:mm a")}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getSentimentColor(review.sentiment)}`}
              >
                {review.sentiment.charAt(0).toUpperCase() +
                  review.sentiment.slice(1)}
              </Badge>

              <Badge
                variant="outline"
                className={`${getStatusColor(review.status)}`}
              >
                {getStatusIcon(review.status)}
                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </Badge>

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
                      navigator.clipboard.writeText(review.content);
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
          <p className="text-gray-700 whitespace-pre-line">{review.content}</p>

          {review.photos && review.photos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {review.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-md border border-gray-200"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {review.replyContent && review.replyDate && (
        <Card className="mb-4 border-l-4 border-l-locaposty-primary">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-md flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-locaposty-primary" />
                  Your Reply
                </CardTitle>
                <CardDescription>
                  {format(new Date(review.replyDate), "MMMM d, yyyy, h:mm a")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">
              {review.replyContent}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-locaposty-primary" />
            Compose Reply
          </CardTitle>
          <CardDescription>
            Use AI-powered suggestions or create your own personal response
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex gap-2">
                <Select value={selectedTone} onValueChange={setSelectedTone}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="apologetic">Apologetic</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedTemplate}
                  onValueChange={handleSelectTemplate}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-template">No Template</SelectItem>
                    {aiTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAIReply}
                className="text-locaposty-primary border-locaposty-primary"
              >
                <ThumbsUp className="mr-2 h-4 w-4" /> Generate AI Reply
              </Button>
            </div>

            <Textarea
              placeholder="Type your reply here..."
              className="min-h-[150px]"
              value={replyContent}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARACTERS) {
                  setReplyContent(e.target.value);
                }
              }}
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>Reply as Business Owner</span>
              <span
                className={
                  characterCount > MAX_CHARACTERS * 0.9 ? "text-amber-600" : ""
                }
              >
                {characterCount} / {MAX_CHARACTERS} characters
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              toast.success("Reply saved as template", {
                description:
                  "You can now use this response as a template for future replies.",
              });
            }}
          >
            Save as Template
          </Button>

          <Button
            onClick={handleSendReply}
            disabled={!replyContent.trim() || characterCount > MAX_CHARACTERS}
            className="bg-locaposty-primary hover:bg-locaposty-primary/90"
          >
            <Send className="mr-2 h-4 w-4" /> Send Reply
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReviewDetail;
