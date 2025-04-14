
import React from 'react';
import { Calendar, Edit, Trash2, Copy, Image, Tag, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpcomingPostsProps {
  className?: string;
}

const UpcomingPosts: React.FC<UpcomingPostsProps> = ({ className = '' }) => {
  // Mock data - in a real app, this would come from an API
  const posts = [
    {
      id: 1,
      title: "New Seasonal Menu",
      content: "Try our new autumn-inspired drinks and pastries, available for a limited time!",
      date: "2025-04-18T09:00:00",
      type: "update",
      hasMedia: true,
      location: "All locations"
    },
    {
      id: 2,
      title: "Weekend Special",
      content: "Buy one, get one free on all coffee drinks this weekend. Don't miss out!",
      date: "2025-04-20T10:00:00",
      type: "offer",
      hasMedia: true,
      location: "Downtown"
    },
    {
      id: 3,
      title: "Closed for Staff Training",
      content: "We'll be closed from 2-4pm this Tuesday for staff training. Sorry for any inconvenience.",
      date: "2025-04-22T14:00:00",
      type: "update",
      hasMedia: false,
      location: "All locations"
    }
  ];

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // Function to get post type styles
  const getPostTypeStyles = (type: string) => {
    switch (type) {
      case 'offer':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          icon: Tag
        };
      case 'event':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: Calendar
        };
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: Edit
        };
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-locaposty-text-dark">Upcoming Posts</h2>
        <Button variant="outline" size="sm" className="text-locaposty-primary">
          <Calendar size={16} className="mr-1" />
          View Calendar
        </Button>
      </div>
      
      <div className="divide-y divide-gray-100">
        {posts.map((post) => {
          const typeStyle = getPostTypeStyles(post.type);
          
          return (
            <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4 text-center">
                  <div className={`p-2 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                    <typeStyle.icon size={16} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className={`text-xs ${typeStyle.text} ${typeStyle.bg} px-2 py-0.5 rounded-full`}>
                          {post.type === 'offer' ? 'Offer' : post.type === 'event' ? 'Event' : 'Update'}
                        </span>
                        <span className="text-xs text-locaposty-text-medium ml-2">
                          {formatDate(post.date)}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-locaposty-text-dark mt-1">{post.title}</h3>
                      <p className="text-sm text-locaposty-text-medium mt-1 line-clamp-1">{post.content}</p>
                      
                      <div className="flex items-center mt-2 text-xs text-locaposty-text-medium">
                        {post.hasMedia && <Image size={14} className="mr-1" />}
                        {post.hasMedia && <span className="mr-3">1 photo</span>}
                        <MapPin size={14} className="mr-1" />
                        <span>{post.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2 ml-4">
                      <button className="text-gray-400 hover:text-locaposty-primary transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-locaposty-primary transition-colors">
                        <Copy size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="px-5 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100 flex justify-between items-center">
        <a href="#" className="text-sm text-locaposty-primary font-medium hover:underline">
          View all scheduled posts
        </a>
        <Button size="sm" className="bg-locaposty-primary hover:bg-locaposty-primary/90">
          <Plus size={16} className="mr-1" />
          New Post
        </Button>
      </div>
    </div>
  );
};

export default UpcomingPosts;
