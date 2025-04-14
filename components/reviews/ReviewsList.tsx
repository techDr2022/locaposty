
import React from 'react';
import { ReviewType } from '@/data/mockReviewsData';
import { Star, Flag, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ReviewsListProps {
  reviews: ReviewType[];
  selectedReviewId: string | undefined;
  onSelectReview: (review: ReviewType) => void;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, selectedReviewId, onSelectReview }) => {
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
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedReviewId === review.id ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-locaposty-primary' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 mr-2">
                    {review.authorPhoto ? 
                      <img 
                        src={review.authorPhoto} 
                        alt={review.authorName} 
                        className="w-full h-full rounded-full object-cover"
                      /> : 
                      <span>{review.authorName.charAt(0)}</span>
                    }
                  </div>
                  <span className="font-medium">{review.authorName}</span>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {review.content}
              </p>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  {format(new Date(review.date), 'MMM d, yyyy')}
                </span>
                <div className="flex items-center">
                  {review.status === 'flagged' && (
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 mr-1">
                      <Flag size={10} className="mr-1" /> Flagged
                    </Badge>
                  )}
                  {review.status === 'replied' && (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                      <CheckCircle size={10} className="mr-1" /> Replied
                    </Badge>
                  )}
                  {review.status === 'pending' && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                      <Clock size={10} className="mr-1" /> Pending
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="mt-2">
                <div 
                  className={`h-1 rounded-full ${
                    review.sentiment === 'positive' ? 'bg-green-500' : 
                    review.sentiment === 'neutral' ? 'bg-yellow-400' : 'bg-red-500'
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
