
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const CtaSection = () => {
  return (
    <section className="bg-gradient-to-br from-locaposty-primary to-locaposty-primary/80 py-20 text-white">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to supercharge your Google Business presence?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Join thousands of businesses that are saving time and increasing engagement with LocaPosty's automated tools and AI assistance.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                "Start your 14-day free trial today. No credit card required.",
                "Full access to all features during your trial.",
                "Cancel anytime with no obligation.",
                "Dedicated onboarding support to help you get started."
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle2 className="mr-2 flex-shrink-0 mt-1" size={20} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            
            <Button className="bg-white text-locaposty-primary hover:bg-locaposty-accent hover:text-locaposty-primary transition-colors px-8 py-6 text-lg font-medium">
              Start Your Free Trial
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-6">Get in touch with our team</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">Business Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">Number of Locations</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="" className="bg-locaposty-primary">Select number of locations</option>
                  <option value="1" className="bg-locaposty-primary">1 location</option>
                  <option value="2-5" className="bg-locaposty-primary">2-5 locations</option>
                  <option value="6-10" className="bg-locaposty-primary">6-10 locations</option>
                  <option value="11+" className="bg-locaposty-primary">11+ locations</option>
                </select>
              </div>
              <Button className="w-full bg-locaposty-secondary hover:bg-locaposty-secondary/90 text-white transition-colors py-3">
                Request Demo
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
