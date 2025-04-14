
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-white to-locaposty-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-locaposty-text-dark leading-tight mb-6">
              Supercharge Your <span className="text-locaposty-primary">Google Business Profile</span> with Automated Scheduling & AI
            </h1>
            <p className="text-xl text-locaposty-text-medium mb-8 max-w-xl">
              Save hours each week with our all-in-one platform for scheduling posts, managing reviews with AI assistance, and tracking performance.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button className="btn-accent text-lg px-8 py-6">Start Free Trial</Button>
              <Button variant="outline" className="bg-white text-locaposty-text-dark border-locaposty-text-medium flex items-center justify-center space-x-2 text-lg px-8 py-6">
                <Play size={20} className="text-locaposty-secondary" />
                <span>Watch Demo</span>
              </Button>
            </div>
            <p className="text-sm text-locaposty-text-medium mt-4">No credit card required. 14-day free trial.</p>
          </div>
          <div className="relative animate-fade-in">
            <div className="bg-white p-2 rounded-xl shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800" 
                alt="LocaPosty Dashboard" 
                className="rounded-lg w-full"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-locaposty-secondary text-white py-2 px-4 rounded-lg shadow-lg">
              <p className="font-bold">4.9/5 ⭐</p>
              <p className="text-sm">Customer Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
