import React from "react";
import {
  Calendar,
  MessageSquare,
  Eye,
  PhoneCall,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";

interface StatProps {
  title: string;
  value: string | null;
  change?: string;
  trend?: "up" | "down" | null;
  icon: React.ElementType;
  color: string;
  description: string;
  breakdown?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface QuickStatsProps {
  data?: {
    postsScheduled?: number;
    newReviews?: number;
    profileViews?: number;
    customerActions?: number;
    reviewBreakdown?: {
      positive: number;
      neutral: number;
      negative: number;
    };
    changes?: {
      posts?: string;
      reviews?: string;
      views?: string;
      actions?: string;
    };
    trends?: {
      posts?: "up" | "down" | null;
      reviews?: "up" | "down" | null;
      views?: "up" | "down" | null;
      actions?: "up" | "down" | null;
    };
  };
}

const StatCard: React.FC<StatProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  description,
  breakdown,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-locaposty-text-medium text-sm font-medium">
            {title}
          </h3>
          <div className="flex items-baseline mt-1">
            {value ? (
              <>
                <span className="text-2xl font-bold text-locaposty-text-dark">
                  {value}
                </span>
                {change && trend && (
                  <div
                    className={`ml-2 flex items-center text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {trend === "up" ? (
                      <TrendingUp size={14} className="mr-1" />
                    ) : (
                      <TrendingDown size={14} className="mr-1" />
                    )}
                    <span>{change}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm text-locaposty-text-medium">
                No data available
              </span>
            )}
          </div>

          <div className="text-xs text-locaposty-text-medium mt-1">
            {description}
          </div>

          {/* Sentiment breakdown for reviews */}
          {breakdown && (
            <div className="flex mt-2 space-x-2">
              <div className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                {breakdown.positive}
              </div>
              <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1"></span>
                {breakdown.neutral}
              </div>
              <div className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
                {breakdown.negative}
              </div>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-full ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const QuickStats: React.FC<QuickStatsProps> = ({ data }) => {
  // Define default stats
  const stats: StatProps[] = [
    {
      title: "Posts Scheduled",
      value: data?.postsScheduled?.toString() || null,
      change: data?.changes?.posts,
      trend: data?.trends?.posts || null,
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
      description: "This week",
    },
    {
      title: "New Reviews",
      value: data?.newReviews?.toString() || null,
      change: data?.changes?.reviews,
      trend: data?.trends?.reviews || null,
      icon: MessageSquare,
      color: "bg-orange-100 text-orange-600",
      description: "Last 7 days",
      breakdown: data?.reviewBreakdown,
    },
    {
      title: "Profile Views",
      value: data?.profileViews?.toString() || null,
      change: data?.changes?.views,
      trend: data?.trends?.views || null,
      icon: Eye,
      color: "bg-purple-100 text-purple-600",
      description: "This month",
    },
    {
      title: "Customer Actions",
      value: data?.customerActions?.toString() || null,
      change: data?.changes?.actions,
      trend: data?.trends?.actions || null,
      icon: PhoneCall,
      color: "bg-green-100 text-green-600",
      description: "Calls, directions, etc.",
    },
  ];

  // If no data is provided, show an empty state message
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex items-center text-locaposty-text-medium">
          <Info className="mr-2 h-5 w-5 text-locaposty-primary" />
          <p>
            Stats will appear here once you connect your Google Business Profile
            and activity data is available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default QuickStats;
