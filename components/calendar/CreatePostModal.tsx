
import React, { useState } from 'react';
import { X, Image, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const [postType, setPostType] = useState<'whatsnew' | 'event' | 'offer'>('whatsnew');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('12:00');
  const [location, setLocation] = useState('all');
  const [activeTab, setActiveTab] = useState('edit');
  
  const handleSubmit = (asDraft: boolean = false) => {
    // In a real app, you would save the post data here
    console.log({
      type: postType,
      title,
      content,
      date,
      time,
      location,
      status: asDraft ? 'draft' : 'scheduled'
    });
    
    // Reset form and close modal
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setPostType('whatsnew');
    setTitle('');
    setContent('');
    setDate(new Date());
    setTime('12:00');
    setLocation('all');
    setActiveTab('edit');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Post</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Post Type</h3>
                <RadioGroup 
                  defaultValue="whatsnew" 
                  value={postType}
                  onValueChange={(value) => setPostType(value as 'whatsnew' | 'event' | 'offer')}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsnew" id="whatsnew" />
                    <Label htmlFor="whatsnew">What's New</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="event" id="event" />
                    <Label htmlFor="event">Event</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="offer" id="offer" />
                    <Label htmlFor="offer">Offer</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="mt-1" 
                  placeholder={`Enter ${postType === 'whatsnew' ? 'update' : postType} title`}
                />
              </div>
              
              <div>
                <Label htmlFor="content" className="text-sm font-medium">Content</Label>
                <Textarea 
                  id="content" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  className="mt-1 h-24" 
                  placeholder="Enter post content..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2">
                  <Label className="text-sm font-medium">Schedule Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full mt-1 justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="w-full sm:w-1/2">
                  <Label className="text-sm font-medium">Time</Label>
                  <div className="flex mt-1 h-10">
                    <div className="relative rounded-md shadow-sm flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="sf">San Francisco</SelectItem>
                    <SelectItem value="nyc">New York</SelectItem>
                    <SelectItem value="la">Los Angeles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Upload Media (Optional)</h3>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <Image className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-600">Drag & drop image here or</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Select File
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF up to 5MB</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="p-4 border rounded-md mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="font-medium">Smith's Cafe</div>
                      <div className="text-xs text-gray-500">Just now</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg">{title || "Post title will appear here"}</h3>
                  <p className="mt-2 text-gray-700">{content || "Your post content will appear here..."}</p>
                </div>
                
                {postType === 'event' && date && (
                  <div className="bg-purple-50 p-2 rounded-md flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-purple-500" />
                    <div className="text-sm">
                      {format(date, 'EEEE, MMMM d, yyyy')} at {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                    </div>
                  </div>
                )}
                
                {postType === 'offer' && (
                  <div className="bg-orange-50 p-2 rounded-md flex items-center gap-2">
                    <div className="text-sm text-orange-700">Limited time offer</div>
                  </div>
                )}
                
                <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-400">Image preview (if uploaded)</p>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-blue-600">Like</Button>
                  <Button size="sm" variant="outline" className="text-blue-600">Comment</Button>
                  <Button size="sm" variant="outline" className="text-blue-600">Share</Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>This is how your post will appear on your Google Business Profile.</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleSubmit(true)}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(false)} className="bg-locaposty-primary hover:bg-locaposty-primary/90">
            Schedule Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
