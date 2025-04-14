
import React from 'react';
import { Edit, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface ActivityTimelineProps {
  className?: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ className = '' }) => {
  // Mock data - in a real app, this would come from an API
  const activities = [
    {
      id: 1,
      type: 'post',
      action: 'published',
      title: 'Weekend Special: 20% Off All Pastries',
      time: '2 hours ago',
      icon: Edit,
      iconColor: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2,
      type: 'review',
      action: 'received',
      rating: 5,
      reviewer: 'Jane Cooper',
      content: 'Amazing coffee and service! The staff was very friendly and...',
      time: '4 hours ago',
      icon: MessageSquare,
      iconColor: 'bg-orange-100 text-orange-600'
    },
    {
      id: 3,
      type: 'reply',
      action: 'sent',
      reviewer: 'Robert Johnson',
      time: 'Yesterday at 3:45 PM',
      icon: CheckCircle,
      iconColor: 'bg-green-100 text-green-600'
    },
    {
      id: 4,
      type: 'alert',
      action: 'warning',
      title: 'Profile information needs updating',
      time: 'Yesterday at 10:23 AM',
      icon: AlertCircle,
      iconColor: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-lg text-locaposty-text-dark">Recent Activity</h2>
      </div>
      <div className="p-0">
        <ul className="divide-y divide-gray-100">
          {activities.map((activity) => (
            <li key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${activity.iconColor} mr-3 mt-0.5`}>
                  <activity.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  {activity.type === 'post' && (
                    <div>
                      <p className="text-sm text-locaposty-text-dark font-medium">
                        Post {activity.action}: <span className="font-normal">{activity.title}</span>
                      </p>
                      <p className="text-xs text-locaposty-text-medium mt-1">{activity.time}</p>
                    </div>
                  )}
                  
                  {activity.type === 'review' && (
                    <div>
                      <p className="text-sm text-locaposty-text-dark font-medium">
                        New review {activity.rating}★ from {activity.reviewer}
                      </p>
                      <p className="text-sm text-locaposty-text-medium mt-1 line-clamp-1">
                        "{activity.content}"
                      </p>
                      <p className="text-xs text-locaposty-text-medium mt-1">{activity.time}</p>
                    </div>
                  )}
                  
                  {activity.type === 'reply' && (
                    <div>
                      <p className="text-sm text-locaposty-text-dark">
                        Reply {activity.action} to <span className="font-medium">{activity.reviewer}</span>'s review
                      </p>
                      <p className="text-xs text-locaposty-text-medium mt-1">{activity.time}</p>
                    </div>
                  )}
                  
                  {activity.type === 'alert' && (
                    <div>
                      <p className="text-sm text-locaposty-text-dark font-medium">
                        {activity.title}
                      </p>
                      <p className="text-xs text-locaposty-text-medium mt-1">{activity.time}</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
          <a href="#" className="text-sm text-locaposty-primary font-medium hover:underline">
            View all activity
          </a>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
