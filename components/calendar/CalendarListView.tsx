
import React from 'react';
import { format } from 'date-fns';
import { PostType } from '@/data/mockCalendarData';
import PostItem from './PostItem';
import { Badge } from '@/components/ui/badge';

interface CalendarListViewProps {
  currentDate: Date;
  posts: PostType[];
  onSelectPost: (postId: string) => void;
  selectedPosts: string[];
}

const CalendarListView: React.FC<CalendarListViewProps> = ({ 
  currentDate,
  posts,
  onSelectPost,
  selectedPosts
}) => {
  // Group posts by date
  const groupedPosts: Record<string, PostType[]> = {};
  
  posts.forEach(post => {
    const date = format(new Date(post.scheduledFor), 'yyyy-MM-dd');
    if (!groupedPosts[date]) {
      groupedPosts[date] = [];
    }
    groupedPosts[date].push(post);
  });

  // Sort dates
  const sortedDates = Object.keys(groupedPosts).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm flex-grow flex items-center justify-center p-12 text-center">
        <div>
          <p className="text-gray-500 mb-2">No posts found for the selected filters</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or create a new post</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 space-y-6 overflow-auto">
      {sortedDates.map(date => {
        const postsForDay = groupedPosts[date];
        const dateObj = new Date(date);
        const isToday = format(new Date(), 'yyyy-MM-dd') === date;
        const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));
        
        return (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{format(dateObj, 'EEEE, MMMM d, yyyy')}</h3>
              {isToday && <Badge className="bg-locaposty-primary">Today</Badge>}
              {isPast && !isToday && <Badge variant="outline" className="text-gray-500">Past</Badge>}
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-gray-100">
              {postsForDay.map(post => (
                <PostItem 
                  key={post.id} 
                  post={post} 
                  isSelected={selectedPosts.includes(post.id)}
                  onSelect={() => onSelectPost(post.id)}
                  view="list"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarListView;
