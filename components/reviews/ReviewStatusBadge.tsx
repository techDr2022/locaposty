import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Flag,
  Bot,
  User,
  MessageSquare,
} from "lucide-react";

interface ReviewStatusBadgeProps {
  status: string;
  replySource?: string;
}

const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({
  status,
  replySource,
}) => {
  // Normalize status to uppercase for consistency
  const normalizedStatus = status.toUpperCase();

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "REPLIED":
        return <CheckCircle size={14} className="mr-1" />;
      case "PENDING":
        return <Clock size={14} className="mr-1" />;
      case "FLAGGED":
        return <Flag size={14} className="mr-1" />;
      default:
        return <MessageSquare size={14} className="mr-1" />;
    }
  };

  // Get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "REPLIED":
        return "bg-green-50 text-green-600 border-green-200";
      case "PENDING":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "FLAGGED":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // Get reply source icon
  const getSourceIcon = (source?: string) => {
    if (!source) return null;

    switch (source) {
      case "AUTO_POSTED":
        return <Bot size={14} className="ml-1" />;
      case "AI_GENERATED":
        return <Bot size={14} className="ml-1" />;
      case "MANUAL":
        return <User size={14} className="ml-1" />;
      default:
        return null;
    }
  };

  // Get source text
  const getSourceText = (source?: string) => {
    if (!source) return "";

    switch (source) {
      case "AUTO_POSTED":
        return " (Auto)";
      case "AI_GENERATED":
        return " (AI)";
      case "MANUAL":
        return " (Manual)";
      default:
        return "";
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusColor(normalizedStatus)}`}>
      {getStatusIcon(normalizedStatus)}
      {normalizedStatus.charAt(0).toUpperCase() +
        normalizedStatus.slice(1).toLowerCase()}
      {getSourceText(replySource)}
      {getSourceIcon(replySource)}
    </Badge>
  );
};

export default ReviewStatusBadge;
