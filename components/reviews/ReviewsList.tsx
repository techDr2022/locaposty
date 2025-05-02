import React from "react";
import { Star } from "lucide-react";
import { format } from "date-fns";
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

interface ReviewsListProps {
  reviews: Review[];
  selectedReviewId: string | undefined;
  onSelectReview: (review: Review) => void;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  selectedReviewId,
  onSelectReview,
}) => {
  return (
    <div className="h-full overflow-auto">
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
          <p className="text-gray-500">No reviews match your filters</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <li
              key={review.id}
              onClick={() => onSelectReview(review)}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedReviewId === review.id ? "bg-blue-50 hover:bg-blue-50 border-l-4 border-locaposty-primary" : ""}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 mr-2">
                    {review.authorPhoto ? (
                      <img
                        src={review.authorPhoto}
                        alt={review.authorName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{review.authorName.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-medium">{review.authorName}</span>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {review.comment || "No comment provided"}
              </p>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  {format(new Date(review.createTime), "MMM d, yyyy")}
                </span>
                <div className="flex items-center">
                  <ReviewStatusBadge
                    status={review.status}
                    replySource={
                      review.replies.length > 0
                        ? review.replies[0].source
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="mt-2">
                <div
                  className={`h-1 rounded-full ${
                    review.sentiment === "POSITIVE"
                      ? "bg-green-500"
                      : review.sentiment === "NEUTRAL"
                        ? "bg-yellow-400"
                        : review.sentiment === "NEGATIVE"
                          ? "bg-red-500"
                          : "bg-gray-300"
                  }`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewsList;
