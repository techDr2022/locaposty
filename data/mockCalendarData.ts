
export type PostType = {
  id: string;
  title: string;
  content: string;
  type: 'whatsnew' | 'event' | 'offer';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor: string;
  location: string;
  isRecurring?: boolean;
  recurringPattern?: string;
};

export const mockPosts: PostType[] = [
  {
    id: '1',
    title: 'New Menu Items This Week',
    content: 'Try our new seasonal specialties! Fresh ingredients directly from local farmers.',
    type: 'whatsnew',
    status: 'scheduled',
    scheduledFor: '2025-04-15T10:00:00',
    location: 'sf'
  },
  {
    id: '2',
    title: 'Weekend Jazz Night',
    content: 'Join us this Saturday for live jazz music from 7pm to 10pm. No cover charge!',
    type: 'event',
    status: 'scheduled',
    scheduledFor: '2025-04-17T14:30:00',
    location: 'sf'
  },
  {
    id: '3',
    title: '25% Off Family Meals',
    content: 'Get 25% off all family-sized meals this week. Perfect for takeout or delivery.',
    type: 'offer',
    status: 'draft',
    scheduledFor: '2025-04-16T09:00:00',
    location: 'nyc'
  },
  {
    id: '4',
    title: 'Meet Our New Chef',
    content: "We're excited to introduce our new executive chef, Maria Rodriguez. Come taste her amazing creations!",
    type: 'whatsnew',
    status: 'published',
    scheduledFor: '2025-04-13T12:00:00',
    location: 'la'
  },
  {
    id: '5',
    title: 'Wine Tasting Event',
    content: 'Join our sommelier for a special wine tasting event featuring local vineyards.',
    type: 'event',
    status: 'scheduled',
    scheduledFor: '2025-04-19T18:00:00',
    location: 'nyc',
    isRecurring: true,
    recurringPattern: 'monthly'
  },
  {
    id: '6',
    title: 'Free Coffee Monday',
    content: 'Start your week right! Get a free coffee with any breakfast purchase.',
    type: 'offer',
    status: 'scheduled',
    scheduledFor: '2025-04-20T07:00:00',
    location: 'sf',
    isRecurring: true,
    recurringPattern: 'weekly'
  },
  {
    id: '7',
    title: 'New Outdoor Seating Area',
    content: "We've expanded our patio! Come enjoy your meal in our beautiful new outdoor space.",
    type: 'whatsnew',
    status: 'scheduled',
    scheduledFor: '2025-04-21T11:00:00',
    location: 'la'
  },
  {
    id: '8',
    title: 'Cooking Class for Kids',
    content: 'Bring your little chefs for a fun cooking class. Ages 7-12 welcome.',
    type: 'event',
    status: 'failed',
    scheduledFor: '2025-04-14T15:00:00',
    location: 'nyc'
  },
  {
    id: '9',
    title: 'Buy One Get One Free Desserts',
    content: 'Sweet deal alert! Buy any dessert and get a second one free.',
    type: 'offer',
    status: 'scheduled',
    scheduledFor: '2025-04-22T16:00:00',
    location: 'sf'
  },
  {
    id: '10',
    title: 'Extended Happy Hour',
    content: 'Now offering happy hour pricing from 3pm to 7pm, Monday through Friday!',
    type: 'whatsnew',
    status: 'scheduled',
    scheduledFor: '2025-04-23T13:00:00',
    location: 'la'
  },
  {
    id: '11',
    title: 'Local Artist Showcase',
    content: "Support local artists! We're displaying works from Bay Area painters all month.",
    type: 'event',
    status: 'scheduled',
    scheduledFor: '2025-04-15T17:00:00',
    location: 'sf'
  },
  {
    id: '12',
    title: 'Senior Discount Day',
    content: '15% off for customers 65+ every Wednesday.',
    type: 'offer',
    status: 'scheduled',
    scheduledFor: '2025-04-16T08:00:00',
    location: 'nyc',
    isRecurring: true,
    recurringPattern: 'weekly'
  }
];
