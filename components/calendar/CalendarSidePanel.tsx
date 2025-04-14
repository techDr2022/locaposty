
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { PostType } from '@/data/mockCalendarData';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import PostItem from './PostItem';

interface CalendarSidePanelProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  upcomingPosts: PostType[];
  toggleSidePanel: () => void;
}

const CalendarSidePanel: React.FC<CalendarSidePanelProps> = ({ 
  currentDate,
  onDateChange,
  upcomingPosts,
  toggleSidePanel
}) => {
  return (
    <div className="w-full md:w-72 h-full bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-sm">Calendar Navigator</h3>
        <Button variant="ghost" size="icon" onClick={toggleSidePanel}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-1">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => date && onDateChange(date)}
          className="rounded-md"
        />
      </div>
      
      <Separator />
      
      <div className="p-3 border-b border-gray-100">
        <h3 className="font-medium text-sm">Upcoming Posts</h3>
      </div>
      
      <ScrollArea className="flex-grow p-2">
        {upcomingPosts.length > 0 ? (
          <div className="space-y-2">
            {upcomingPosts.map(post => (
              <div key={post.id} className="p-2 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-500 mb-1">
                  {format(new Date(post.scheduledFor), 'EEE, MMM d • h:mm a')}
                </div>
                <div className="text-sm font-medium line-clamp-2">{post.title}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
            <CalendarIcon className="h-8 w-8 mb-2 text-gray-300" />
            <p className="text-sm">No upcoming posts</p>
          </div>
        )}
      </ScrollArea>
      
      <div className="p-3 border-t border-gray-100">
        <Button variant="outline" className="w-full" size="sm">
          View All Upcoming
        </Button>
      </div>
    </div>
  );
};

export default CalendarSidePanel;
