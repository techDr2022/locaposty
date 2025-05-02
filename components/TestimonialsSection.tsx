"use client";

import React, { useState, useEffect, useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

// Add animation keyframes to a style tag
const InfiniteScrollStyle = () => (
  <style jsx global>{`
    @keyframes scroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(calc(-50% - 1px)); /* Fix gap on loop restart */
      }
    }

    .animate-infinite-scroll {
      animation: scroll 25s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      transform: translateZ(0);
    }

    .animate-infinite-scroll:hover,
    .animate-infinite-scroll.paused {
      animation-play-state: paused;
    }

    @keyframes testimonialsScroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(calc(-50% - 1px)); /* Fix gap on loop restart */
      }
    }

    .testimonial-scroll {
      animation: testimonialsScroll 40s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      transform: translateZ(0);
    }

    .testimonial-scroll:hover,
    .testimonial-scroll.paused {
      animation-play-state: paused;
    }

    .testimonial-scroll.smooth-restart {
      animation: none;
      transition: transform 0.5s ease-out;
    }

    .testimonial-card {
      height: 400px;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      backface-visibility: hidden;
    }

    .testimonial-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
    }

    .testimonial-card blockquote {
      overflow-y: auto;
      flex-grow: 1;
      display: -webkit-box;
      -webkit-line-clamp: 12;
      -webkit-box-orient: vertical;
      max-height: 250px;
      scrollbar-width: thin;
      scrollbar-color: rgba(124, 58, 237, 0.3) rgba(124, 58, 237, 0.1);
    }

    .testimonial-card blockquote::-webkit-scrollbar {
      width: 6px;
    }

    .testimonial-card blockquote::-webkit-scrollbar-track {
      background: rgba(124, 58, 237, 0.1);
      border-radius: 10px;
    }

    .testimonial-card blockquote::-webkit-scrollbar-thumb {
      background: rgba(124, 58, 237, 0.3);
      border-radius: 10px;
    }

    .manual-scroll-container {
      overflow-x: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
      scroll-behavior: smooth;
    }

    .manual-scroll-container::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .scroll-control {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 20;
      background: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .scroll-control:hover {
      background: #7c3aed;
      color: white;
      transform: translateY(-50%) scale(1.1);
    }

    .scroll-left {
      left: 12px;
    }

    .scroll-right {
      right: 12px;
    }

    .logo-container {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 20px;
      transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .logo-container:hover {
      transform: scale(1.15);
    }

    .logo-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      filter: grayscale(30%);
      opacity: 0.8;
      transition: all 0.3s ease;
    }

    .logo-img:hover {
      filter: grayscale(0%);
      opacity: 1;
    }

    .trust-stats {
      transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
    }

    .trust-stats:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
    }
  `}</style>
);

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
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollView, setIsScrollView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const testimonialScrollRef = useRef<HTMLDivElement>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Function to handle manual scrolling
  const scrollTestimonials = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollContainer = scrollContainerRef.current;
    const scrollAmount = 400; // Width of a card + margin

    const newScrollLeft =
      direction === "left"
        ? scrollContainer.scrollLeft - scrollAmount
        : scrollContainer.scrollLeft + scrollAmount;

    scrollContainer.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    // Temporarily pause the animation when manually scrolling
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  // Initialize on client side only
  useEffect(() => {
    setIsClient(true);

    // Detect if screen is large enough for scroll view
    const checkScreenSize = () => {
      setIsScrollView(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Handle scroll transition restart to avoid jumpiness
  useEffect(() => {
    if (!testimonialScrollRef.current || !isScrollView) return;

    // Restart animation smoothly if it gets to the end
    const handleAnimationIteration = () => {
      if (isHovered || isPaused) return;

      setIsResetting(true);
      testimonialScrollRef.current!.style.transform = "translateX(0)";

      setTimeout(() => {
        setIsResetting(false);
      }, 50);
    };

    const scrollElement = testimonialScrollRef.current;
    scrollElement.addEventListener(
      "animationiteration",
      handleAnimationIteration
    );

    return () => {
      scrollElement.removeEventListener(
        "animationiteration",
        handleAnimationIteration
      );
    };
  }, [isScrollView, isHovered, isPaused]);

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
      companyLogo: "/images/techdr-logo.webp",
      rating: 5,
    },
    {
      quote:
        "Improved our GMB engagement and search presence. Using Locaposty has helped us consistently post on our Google Business Profile, which improved our local search visibility. The automatic review response feature also helps maintain a good reputation. A must-have for GMB optimization!",
      author: "Gowthami",
      position: "Digital Marketing Expert",
      company: "LK Hospitals",
      avatar: "/images/gowthami-expert.jpg",
      companyLogo: "/images/LK-hospitals-logo.webp",
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

  // Auto slide for testimonials with pause on hover
  useEffect(() => {
    if (isHovered || isScrollView || isPaused) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length, isHovered, isScrollView, isPaused]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

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

  const getVisibleTestimonials = (current: number, total: number) => {
    // We'll simulate a responsive slider with 1, 2, or 3 items
    const indices = [current];

    // Add the next testimonial (for medium screens)
    indices.push((current + 1) % total);

    // Add one more (for large screens)
    indices.push((current + 2) % total);

    return indices;
  };

  // Don't render on server side
  if (!isClient) {
    return (
      <section className="bg-locaposty-accent/30 py-20">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
              What Our <span className="text-locaposty-primary">Customers</span>{" "}
              Say
            </h2>
          </div>
          <div className="h-[400px] flex items-center justify-center">
            <p>Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-locaposty-accent/30 py-20 overflow-hidden">
      <InfiniteScrollStyle />
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            What Our <span className="text-locaposty-primary">Customers</span>{" "}
            Say
          </h2>
        </div>

        {/* Large screens: Infinite Scroll Testimonials */}
        {isScrollView ? (
          <div className="relative overflow-hidden">
            {/* Manual scroll controls */}
            <button
              className="scroll-control scroll-left"
              onClick={() => scrollTestimonials("left")}
              aria-label="Scroll testimonials left"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              className="scroll-control scroll-right"
              onClick={() => scrollTestimonials("right")}
              aria-label="Scroll testimonials right"
            >
              <ChevronRight size={20} />
            </button>

            {/* Gradient fades at the edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-locaposty-accent/30 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-locaposty-accent/30 to-transparent z-10"></div>

            <div
              className="py-8 px-4 relative manual-scroll-container"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              ref={scrollContainerRef}
            >
              <div
                ref={testimonialScrollRef}
                className={`flex ${isResetting ? "smooth-restart" : "testimonial-scroll"} ${isPaused ? "paused" : ""}`}
              >
                {/* First set of testimonials */}
                {testimonials.map((testimonial, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-xl shadow-md flex-shrink-0 transform testimonial-card mx-4"
                    style={{ width: "380px" }}
                  >
                    <div className="flex items-center space-x-1 mb-4">
                      {renderStars(testimonial.rating)}
                    </div>
                    <blockquote className="text-locaposty-text-medium mb-6 italic text-sm leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-locaposty-primary/20"
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

                {/* Duplicate set for seamless loop */}
                {testimonials.map((testimonial, i) => (
                  <div
                    key={`duplicate-${i}`}
                    className="bg-white p-6 rounded-xl shadow-md flex-shrink-0 transform testimonial-card mx-4"
                    style={{ width: "380px" }}
                  >
                    <div className="flex items-center space-x-1 mb-4">
                      {renderStars(testimonial.rating)}
                    </div>
                    <blockquote className="text-locaposty-text-medium mb-6 italic text-sm leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-locaposty-primary/20"
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
            </div>
          </div>
        ) : (
          // Medium/Small screens: Traditional Slider
          <div
            className="relative px-12 md:px-20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={prevTestimonial}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md text-locaposty-primary hover:bg-locaposty-primary hover:text-white transition-all hover:scale-110"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Tablet View (grid) */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:hidden">
              {getVisibleTestimonials(
                currentTestimonial,
                testimonials.length
              ).map((index) => (
                <div
                  key={`desktop-${index}`}
                  className="bg-white p-6 rounded-xl shadow-md h-full transform transition-all duration-500 hover:shadow-xl hover:scale-105 flex flex-col"
                >
                  <div className="flex items-center space-x-1 mb-4">
                    {renderStars(testimonials[index].rating)}
                  </div>
                  <blockquote className="text-locaposty-text-medium mb-6 italic text-sm leading-relaxed flex-grow overflow-y-auto">
                    &ldquo;{testimonials[index].quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                    <img
                      src={testimonials[index].avatar}
                      alt={testimonials[index].author}
                      className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-locaposty-primary/20"
                    />
                    <div>
                      <p className="font-semibold text-locaposty-text-dark">
                        {testimonials[index].author}
                      </p>
                      <p className="text-sm text-locaposty-text-medium">
                        {testimonials[index].position},{" "}
                        {testimonials[index].company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View (single card) */}
            <div className="md:hidden">
              <div
                className="bg-white p-6 rounded-xl shadow-md transition-all duration-500 hover:shadow-xl flex flex-col"
                style={{ minHeight: "400px" }}
              >
                <div className="flex items-center space-x-1 mb-4">
                  {renderStars(testimonials[currentTestimonial].rating)}
                </div>
                <blockquote className="text-locaposty-text-medium mb-6 italic leading-relaxed flex-grow overflow-y-auto">
                  &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                </blockquote>
                <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].author}
                    className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-locaposty-primary/20"
                  />
                  <div>
                    <p className="font-semibold text-locaposty-text-dark">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-sm text-locaposty-text-medium">
                      {testimonials[currentTestimonial].position},{" "}
                      {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dots for mobile */}
              <div className="flex justify-center mt-4 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial
                        ? "bg-locaposty-primary w-4"
                        : "bg-gray-300"
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={nextTestimonial}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md text-locaposty-primary hover:bg-locaposty-primary hover:text-white transition-all hover:scale-110"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        {/* Enhanced Trust Section */}
        <div className="mt-24">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-locaposty-text-dark mb-2">
              Trusted by Leading Businesses
            </h3>
            <div className="w-20 h-1 bg-locaposty-primary mx-auto rounded-full"></div>
          </div>

          {/* Logo Marquee */}
          <div className="relative bg-white py-8 px-4 rounded-xl shadow-md overflow-hidden">
            {/* Gradient fades at the edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>

            <div
              className="relative overflow-hidden w-full"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <div
                className={`flex animate-infinite-scroll ${isLogoHovered ? "paused" : ""}`}
              >
                {/* First set of logos */}
                {testimonials.map((testimonial, i) => (
                  <div key={i} className="logo-container">
                    <img
                      src={testimonial.companyLogo}
                      alt={testimonial.company}
                      className="logo-img"
                    />
                  </div>
                ))}

                {/* Duplicate set for seamless loop */}
                {testimonials.map((testimonial, i) => (
                  <div key={`duplicate-${i}`} className="logo-container">
                    <img
                      src={testimonial.companyLogo}
                      alt={testimonial.company}
                      className="logo-img"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
