import React from "react";
import { Star } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  position: string;
  company: string;
  avatar: string;
  companyLogo: string;
  rating: number;
}

const TestimonialsSection = () => {
  const testimonials: Testimonial[] = [
    {
      quote:
        "Best tool for GMB post scheduling and review management. Locaposty is the perfect GMB scheduler! I can easily schedule Google Business posts in advance and reply to customer reviews automatically. It's saved me so much time and helps boost our local SEO rankings. Highly recommend it for local businesses and digital marketers.",
      author: "Goutham Anumala ",
      position: "CEO",
      company: "Revolynk Tech Pvt Ltd",
      avatar: "/images/gowtham-ceo.jpg",
      companyLogo: "/images/revolynk-logo.jpg",
      rating: 5,
    },
    {
      quote:
        "All-in-one GMB marketing tool for local SEO. Locaposty combines Google My Business scheduling, automated review replies, and report generation in one powerful dashboard. Our visibility on Google Maps has improved since using it. Great for SEO agencies managing multiple client listings!",
      author: "Jagdeesh",
      position: "SEO Expert",
      company: "Digit Arrow",
      avatar: "/images/jagdeesh-seo.jpg",
      companyLogo: "/images/digit-arrow-logo.png",
      rating: 5,
    },
    {
      quote:
        "Saves me hours every week! Locaposty has been a game-changer for managing our Google Business Profile. Scheduling posts is super easy, and the automated review responses help us stay professional and prompt. Love the clean dashboard and time-saving features.",
      author: "Raviteja Pendari",
      position: "CEO",
      company: "techDr",
      avatar: "/images/raviteja-ceo.jpg",
      companyLogo: "/images/techdr-logo.png",
      rating: 5,
    },
    {
      quote:
        "Improved our GMB engagement and search presence. Using Locaposty has helped us consistently post on our Google Business Profile, which improved our local search visibility. The automatic review response feature also helps maintain a good reputation. A must-have for GMB optimization!",
      author: "Gowthami",
      position: "Digital Marketing Expert",
      company: "LK Hospitals",
      avatar: "/images/gowthami-expert.jpg",
      companyLogo: "/images/lk-hospitals-logo.png",
      rating: 5,
    },
    {
      quote:
        "Boosted our local search rankings with consistent GMB posts. Locaposty helped us stay active on our Google My Business listing. Scheduling posts, managing customer reviews, and getting weekly SEO reports—all in one place! It's the best tool for improving local SEO and reputation management.",
      author: "Shaheena",
      position: "Content Creator",
      company: "JJ Hospital",
      companyLogo: "/images/jj-hospital-logo.jpg",
      avatar: "/images/shaheena-creator.jpg",
      rating: 5,
    },
  ];

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={index}
          size={16}
          className={
            index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }
        />
      ));
  };

  return (
    <section className="bg-locaposty-accent/30 py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            What Our <span className="text-locaposty-primary">Customers</span>{" "}
            Say
          </h2>
          {/* <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto">
            Join over 2,500 businesses managing 8,000+ locations with LocaPosty.
          </p> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center space-x-1 mb-4">
                {renderStars(testimonial.rating)}
              </div>
              <blockquote className="text-locaposty-text-medium mb-6 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-semibold text-locaposty-text-dark">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-locaposty-text-medium">
                    {testimonial.position}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-8 items-center">
          <p className="text-xl font-semibold text-locaposty-text-dark mr-4">
            Trusted by businesses like:
          </p>
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="h-10 w-32 bg-white/50 rounded flex items-center justify-center text-locaposty-text-medium font-medium"
            >
              <img
                src={testimonial.companyLogo}
                alt={testimonial.company}
                className="w-64 h-12 mr-4 object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
