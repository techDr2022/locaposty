
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { PostType } from '@/data/mockCalendarData';
import PostItem from './PostItem';

interface CalendarGridProps {
  currentDate: Date;
  posts: PostType[];
  onSelectPost: (postId: string) => void;
  selectedPosts: string[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  currentDate,
  posts,
  onSelectPost,
  selectedPosts
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names for the header (Sun, Mon, Tue, etc.)
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const getPostsForDay = (day: Date) => {
    return posts.filter(post => 
      isSameDay(new Date(post.scheduledFor), day)
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {dayNames.map((day, index) => (
          <div 
            key={index} 
            className="font-semibold p-2 text-sm text-center bg-white"
          >
            <span className="md:hidden">{day.substring(0, 1)}</span>
            <span className="hidden md:inline">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>
      
      <div className="flex-grow grid grid-cols-7 auto-rows-fr gap-px bg-gray-100 overflow-auto">
        {days.map((day, i) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={i}
              className={cn(
                "bg-white p-1 min-h-[100px] flex flex-col",
                !isCurrentMonth && "opacity-40",
                isCurrentDay && "ring-2 ring-blue-200",
              )}
            >
              <div className={cn(
                "text-sm font-medium p-1 flex justify-between items-center",
                isCurrentDay && "rounded-full bg-locaposty-primary text-white w-8 h-8 flex items-center justify-center"
              )}>
                <div className={cn(
                  isCurrentDay ? "mx-auto" : ""
                )}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="overflow-y-auto flex-grow space-y-1 mt-1">
                {dayPosts.length > 0 ? (
                  dayPosts.map((post) => (
                    <PostItem 
                      key={post.id} 
                      post={post} 
                      isSelected={selectedPosts.includes(post.id)}
                      onSelect={() => onSelectPost(post.id)}
                      view="calendar"
                    />
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    {isCurrentMonth && "No posts"}
                  </div>
                )}
                
                {dayPosts.length > 3 && (
                  <div className="text-xs text-center bg-gray-100 rounded p-1 cursor-pointer hover:bg-gray-200">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
