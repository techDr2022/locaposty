
export type ReviewType = {
  id: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  content: string;
  date: string;
  photos?: string[];
  location: string;
  replyContent?: string;
  replyDate?: string;
  status: 'pending' | 'replied' | 'flagged';
  sentiment: 'positive' | 'neutral' | 'negative';
};

export const mockReviews: ReviewType[] = [
  {
    id: '1',
    authorName: 'Emily Johnson',
    rating: 5,
    content: "Love the coffee and atmosphere! This is my go-to spot for remote work. The wifi is fast and reliable, and the staff is always friendly. I especially enjoy their seasonal lattes and fresh pastries.",
    date: '2025-04-12T14:32:00',
    location: 'sf',
    replyContent: "Thank you for your kind words, Emily! We're thrilled to be your go-to work spot. We just added some new seasonal items to our menu - hope to see you again soon!",
    replyDate: '2025-04-12T16:45:00',
    status: 'replied',
    sentiment: 'positive'
  },
  {
    id: '2',
    authorName: 'Michael Chen',
    rating: 4,
    content: "Great pastries and friendly staff. The wifi can be a bit slow during peak hours, but otherwise it's a nice place to hang out. Would definitely recommend trying their almond croissants.",
    date: '2025-04-11T09:15:00',
    location: 'sf',
    status: 'pending',
    sentiment: 'positive'
  },
  {
    id: '3',
    authorName: 'Sarah Davis',
    rating: 2,
    content: "Waited 20 minutes for my order during lunch yesterday. The food was good when it finally arrived, but the service needs improvement. Not sure if I'll be back anytime soon.",
    date: '2025-04-10T13:22:00',
    location: 'nyc',
    status: 'flagged',
    sentiment: 'negative'
  },
  {
    id: '4',
    authorName: 'David Wilson',
    rating: 5,
    content: "The best brunch in town! I've tried almost everything on their menu and have never been disappointed. The avocado toast with poached eggs is exceptional. Nice ambiance too.",
    date: '2025-04-09T11:05:00',
    location: 'la',
    replyContent: "Thanks for being such a loyal customer, David! We're glad you enjoy our brunch menu. We've just added some new items you might want to try on your next visit!",
    replyDate: '2025-04-09T14:30:00',
    status: 'replied',
    sentiment: 'positive'
  },
  {
    id: '5',
    authorName: 'Jennifer Lopez',
    rating: 3,
    content: "Average experience. Food was okay but nothing special. The place was clean and staff was nice, but I expected more based on the reviews. Might give it another chance.",
    date: '2025-04-08T18:45:00',
    location: 'nyc',
    status: 'pending',
    sentiment: 'neutral'
  },
  {
    id: '6',
    authorName: 'Robert Brown',
    rating: 1,
    content: "Terrible experience! My order was completely wrong and when I asked to have it corrected, the staff was dismissive. Will not be returning and don't recommend to others.",
    date: '2025-04-07T19:20:00',
    location: 'la',
    status: 'flagged',
    sentiment: 'negative'
  },
  {
    id: '7',
    authorName: 'Jessica Taylor',
    rating: 5,
    content: "Just discovered this gem and I'm already in love! The atmosphere is cozy, the coffee is excellent, and they have great options for vegans. Can't wait to come back!",
    date: '2025-04-06T10:10:00',
    location: 'sf',
    status: 'pending',
    sentiment: 'positive'
  },
  {
    id: '8',
    authorName: 'Thomas Anderson',
    rating: 4,
    content: "Solid breakfast menu with good quality ingredients. The service was prompt and friendly. My only suggestion would be to add more vegetarian options.",
    date: '2025-04-05T08:30:00',
    location: 'nyc',
    replyContent: "Thank you for your feedback, Thomas! We're actually working on expanding our vegetarian options. Stay tuned for our updated menu next month!",
    replyDate: '2025-04-05T11:15:00',
    status: 'replied',
    sentiment: 'positive'
  },
  {
    id: '9',
    authorName: 'Amanda Harris',
    rating: 3,
    content: "Decent place for a quick lunch. Nothing exceptional but gets the job done. Prices are a bit on the higher side for what you get. The outdoor seating area is nice though.",
    date: '2025-04-04T12:40:00',
    location: 'la',
    status: 'pending',
    sentiment: 'neutral'
  },
  {
    id: '10',
    authorName: 'Kevin Martin',
    rating: 5,
    content: "Amazing breakfast! The pancakes are fluffy and delicious, and the coffee is some of the best I've had in town. Will definitely be back with friends and family.",
    date: '2025-04-03T09:50:00',
    location: 'sf',
    replyContent: "We appreciate your kind review, Kevin! Our pancakes are indeed a customer favorite. We look forward to serving you and your loved ones again soon!",
    replyDate: '2025-04-03T13:20:00',
    status: 'replied',
    sentiment: 'positive'
  }
];

export const aiTemplates = [
  {
    id: 'template1',
    name: 'Thank You Template',
    content: 'Thank you for your review! We appreciate your feedback and are glad to hear about your experience. We hope to see you again soon!',
    tone: 'friendly'
  },
  {
    id: 'template2',
    name: 'Apology Template',
    content: "We're sorry to hear about your experience. We strive to provide excellent service, and we clearly missed the mark. Please contact our manager at manager@example.com so we can make this right.",
    tone: 'apologetic'
  },
  {
    id: 'template3',
    name: 'Feedback Appreciation',
    content: "Thank you for your valuable feedback. We're always looking to improve, and customer insights like yours help us do just that. We've noted your suggestions and will work on implementing them.",
    tone: 'formal'
  }
];

export const aiSuggestions = {
  positive: [
    "Thank you for your wonderful review! We're thrilled to hear you enjoyed your experience with us. We work hard to provide quality service, and it's rewarding to know our efforts are appreciated. We hope to welcome you back again soon!",
    "We're delighted by your positive feedback! It's customers like you who make what we do so rewarding. Thank you for taking the time to share your experience, and we look forward to serving you again in the near future!"
  ],
  neutral: [
    "Thank you for sharing your feedback. We appreciate you taking the time to review your experience with us. We're constantly working to improve our offerings and service, and your insights are valuable to that process. We hope to have the opportunity to exceed your expectations on your next visit.",
    "We appreciate your honest review. Your feedback helps us understand where we can improve. We'd love to hear more about how we could make your next experience with us even better. Please don't hesitate to reach out to our manager with any specific suggestions."
  ],
  negative: [
    "We sincerely apologize for your disappointing experience. This is not the level of service we strive to provide, and we take your feedback very seriously. Please know that we are addressing the issues you've mentioned. We would appreciate the opportunity to make things right - please contact our manager directly at manager@example.com.",
    "We're truly sorry that your experience with us didn't meet expectations. Your satisfaction is important to us, and we would like to learn more about what happened and how we can improve. Please reach out to us directly so we can address your concerns and make things right."
  ]
};
