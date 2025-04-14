
import React from 'react';
import { Calendar, MessageSquare, Eye, PhoneCall, TrendingUp, TrendingDown } from 'lucide-react';

const QuickStats = () => {
  // Mock data - in a real app, this would come from an API
  const stats = [
    {
      title: "Posts Scheduled",
      value: "12",
      change: "+4",
      trend: "up",
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
      description: "This week"
    },
    {
      title: "New Reviews",
      value: "8",
      change: "+2",
      trend: "up",
      icon: MessageSquare,
      color: "bg-orange-100 text-orange-600",
      description: "Last 7 days",
      breakdown: {
        positive: 6,
        neutral: 1,
        negative: 1
      }
    },
    {
      title: "Profile Views",
      value: "432",
      change: "-3%",
      trend: "down",
      icon: Eye,
      color: "bg-purple-100 text-purple-600",
      description: "This month"
    },
    {
      title: "Customer Actions",
      value: "56",
      change: "+12%",
      trend: "up",
      icon: PhoneCall,
      color: "bg-green-100 text-green-600",
      description: "Calls, directions, etc."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-locaposty-text-medium text-sm font-medium">{stat.title}</h3>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-locaposty-text-dark">{stat.value}</span>
                <div className={`ml-2 flex items-center text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              
              <div className="text-xs text-locaposty-text-medium mt-1">{stat.description}</div>
              
              {/* Sentiment breakdown for reviews */}
              {stat.breakdown && (
                <div className="flex mt-2 space-x-2">
                  <div className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                    {stat.breakdown.positive}
                  </div>
                  <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1"></span>
                    {stat.breakdown.neutral}
                  </div>
                  <div className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
                    {stat.breakdown.negative}
                  </div>
                </div>
              )}
            </div>
            <div className={`p-2.5 rounded-full ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
