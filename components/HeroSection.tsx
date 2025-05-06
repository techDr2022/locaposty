import React from "react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-white to-locaposty-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-locaposty-text-dark leading-tight mb-6">
              Supercharge Your{" "}
              <span className="text-locaposty-primary">
                Google Business Profile
              </span>{" "}
              with Automated Scheduling & AI
            </h1>
            <p className="text-xl text-locaposty-text-medium mb-8 max-w-xl">
              Save hours each week with our all-in-one platform for scheduling
              posts, managing reviews with AI assistance, and tracking
              performance.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button className="btn-accent text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </div>
            <p className="text-sm text-locaposty-text-medium mt-4">
              No credit card required. 7-day free trial.
            </p>
          </div>
          <div className="relative animate-fade-in lg:-right-12 lg:scale-125 xl:scale-135 transform transition-all duration-500 z-10 mt-8 lg:mt-0">
            <div className="rounded-xl overflow-hidden">
              <div className="rounded-lg w-full relative aspect-video">
                <img
                  src="/herosection-video.gif"
                  alt="LocaPosty Dashboard Demo"
                  className="rounded-lg w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
