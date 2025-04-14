
import React from 'react';
import { MessageSquare, Star, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReviewSummary = () => {
  // Mock data - in a real app, this would come from an API
  const reviews = [
    {
      id: 1,
      author: "Emily Johnson",
      rating: 5,
      content: "Love the coffee and atmosphere! This is my go-to spot for remote work.",
      date: "2025-04-12T14:32:00",
      replied: true
    },
    {
      id: 2,
      author: "Michael Chen",
      rating: 4,
      content: "Great pastries and friendly staff. The wifi can be a bit slow during peak hours.",
      date: "2025-04-11T09:15:00",
      replied: false
    }
  ];

  // Mock sentiment data
  const sentiment = {
    positive: 65,
    neutral: 25,
    negative: 10
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-locaposty-text-dark">Review Management</h2>
        <div className="flex items-center">
          <div className="text-sm font-medium mr-2">4.7</div>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-yellow-400"}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Sentiment distribution */}
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-locaposty-text-medium">Sentiment</span>
            <span className="text-locaposty-text-medium">Last 30 days</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${sentiment.positive}%` }}
              ></div>
              <div 
                className="bg-yellow-400 h-full" 
                style={{ width: `${sentiment.neutral}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${sentiment.negative}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600">{sentiment.positive}% Positive</span>
            <span className="text-yellow-600">{sentiment.neutral}% Neutral</span>
            <span className="text-red-600">{sentiment.negative}% Negative</span>
          </div>
        </div>
        
        {/* Latest reviews */}
        <h3 className="text-sm font-medium text-locaposty-text-dark mb-3">Latest Reviews</h3>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-locaposty-text-dark">{review.author}</div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-locaposty-text-medium mt-1 line-clamp-2">{review.content}</p>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-locaposty-text-medium">
                  {new Date(review.date).toLocaleDateString()}
                </span>
                {review.replied ? (
                  <span className="text-green-600">Replied</span>
                ) : (
                  <button className="text-locaposty-primary hover:underline">
                    Reply with AI
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-100 flex justify-between items-center">
        <div className="text-xs text-locaposty-text-medium">
          <span className="font-medium">82%</span> response rate
        </div>
        <Button variant="outline" size="sm" className="text-locaposty-primary">
          <MessageSquare size={16} className="mr-1" />
          Manage Reviews
        </Button>
      </div>
    </div>
  );
};

export default ReviewSummary;
