
import React from 'react';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "LocaPosty has transformed how we manage our multiple Google Business profiles. The AI review responses save us hours every week and the scheduling tool ensures we're always posting fresh content.",
      author: "Sarah Johnson",
      position: "Marketing Director",
      company: "Riverfront Restaurants",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      rating: 5
    },
    {
      quote: "Since using LocaPosty, our engagement has increased by 45%. The analytics show us exactly what content performs best, and the review management has helped improve our overall rating.",
      author: "Michael Chen",
      position: "Owner",
      company: "Urban Fitness Studio",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5
    },
    {
      quote: "As a small business owner, I was struggling to keep up with social posts and review responses. LocaPosty made it easy to schedule content and respond to customers quickly.",
      author: "Alicia Rodriguez",
      position: "Founder",
      company: "Bloom Boutique",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 4
    }
  ];

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index} 
        size={16} 
        className={index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
      />
    ));
  };

  return (
    <section className="bg-locaposty-accent/30 py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            What Our <span className="text-locaposty-primary">Customers</span> Say
          </h2>
          <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto">
            Join over 2,500 businesses managing 8,000+ locations with LocaPosty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center space-x-1 mb-4">
                {renderStars(testimonial.rating)}
              </div>
              <blockquote className="text-locaposty-text-medium mb-6 italic">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.author} 
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-semibold text-locaposty-text-dark">{testimonial.author}</p>
                  <p className="text-sm text-locaposty-text-medium">{testimonial.position}, {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-8 items-center">
          <p className="text-xl font-semibold text-locaposty-text-dark mr-4">Trusted by businesses like:</p>
          {/* Placeholder logos - in a real app, replace with actual client logos */}
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-8 w-32 bg-white/50 rounded flex items-center justify-center text-locaposty-text-medium font-medium">
              Client {i+1}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
