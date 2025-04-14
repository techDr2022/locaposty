
import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MessageSquare, Tag, MapPin, Edit, Trash, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PostType } from '@/data/mockCalendarData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PostItemProps {
  post: PostType;
  isSelected: boolean;
  onSelect: () => void;
  view: 'calendar' | 'list';
}

const PostItem: React.FC<PostItemProps> = ({ 
  post, 
  isSelected, 
  onSelect,
  view
}) => {
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'whatsnew': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'whatsnew': return <MessageSquare className="h-3 w-3" />;
      case 'event': return <Calendar className="h-3 w-3" />;
      case 'offer': return <Tag className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (view === 'calendar') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "text-xs border rounded p-1 cursor-pointer flex items-start gap-1 hover:shadow-sm transition-shadow",
                getTypeColor(post.type),
                isSelected && "ring-2 ring-blue-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Checkbox checked={isSelected} className="h-3 w-3" />
              </div>
              <div className="flex-grow min-w-0 space-y-0.5">
                <div className="font-medium truncate">{post.title}</div>
                <div className="flex items-center text-[10px] opacity-80">
                  <Clock className="h-2 w-2 mr-1" />
                  {format(new Date(post.scheduledFor), 'h:mm a')}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-xs">
              <div className="flex items-center gap-1">
                <Badge className={getTypeColor(post.type)}>
                  {getTypeIcon(post.type)}
                  <span className="ml-1">
                    {post.type === 'whatsnew' ? "What's New" : post.type === 'event' ? 'Event' : 'Offer'}
                  </span>
                </Badge>
                <Badge className={getStatusColor(post.status)}>
                  {post.status}
                </Badge>
              </div>
              <div className="font-medium">{post.title}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{format(new Date(post.scheduledFor), 'h:mm a')}</span>
                <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{post.location === 'sf' ? 'San Francisco' : post.location === 'nyc' ? 'New York' : 'Los Angeles'}</span>
              </div>
              <div className="text-xs">{post.content}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div 
      className={cn(
        "relative bg-white rounded-md border p-3 hover:shadow-sm cursor-pointer transition-shadow",
        isSelected && "ring-2 ring-blue-500"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="absolute top-3 right-3">
        <Checkbox checked={isSelected} />
      </div>
      
      <div className="space-y-2 pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getTypeColor(post.type)}>
            {getTypeIcon(post.type)}
            <span className="ml-1">
              {post.type === 'whatsnew' ? "What's New" : post.type === 'event' ? 'Event' : 'Offer'}
            </span>
          </Badge>
          <Badge className={getStatusColor(post.status)}>
            {post.status}
          </Badge>
        </div>
        
        <h4 className="font-medium">{post.title}</h4>
        
        <div className="text-sm text-gray-600 line-clamp-2">{post.content}</div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{format(new Date(post.scheduledFor), 'h:mm a')}</span>
          <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{post.location === 'sf' ? 'San Francisco' : post.location === 'nyc' ? 'New York' : 'Los Angeles'}</span>
        </div>
        
        <div className="flex items-center gap-2 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-md hover:bg-gray-100">
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-md hover:bg-gray-100">
                  <Copy className="h-4 w-4 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Duplicate</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-md hover:bg-gray-100">
                  <Trash className="h-4 w-4 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default PostItem;
