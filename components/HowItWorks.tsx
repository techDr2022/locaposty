
import React from 'react';
import { Link2, Calendar, MessageSquare, BarChart3 } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Connect GMB Account",
      description: "Securely connect your Google My Business account with just a few clicks.",
      icon: Link2,
      iconBg: "#1E56A0"
    },
    {
      number: 2,
      title: "Schedule Posts",
      description: "Create and schedule your content calendar for weeks or months ahead.",
      icon: Calendar,
      iconBg: "#F76E11"
    },
    {
      number: 3,
      title: "Manage Reviews",
      description: "Respond to customer reviews quickly with AI-assisted suggestions.",
      icon: MessageSquare,
      iconBg: "#1E56A0"
    },
    {
      number: 4,
      title: "Track Performance",
      description: "Monitor the impact of your posts and reviews on your business.",
      icon: BarChart3,
      iconBg: "#F76E11"
    }
  ];

  return (
    <section id="how-it-works" className="bg-locaposty-bg py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            How <span className="text-locaposty-primary">LocaPosty</span> Works
          </h2>
          <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto">
            Get up and running in minutes with our simple four-step process.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-locaposty-accent" aria-hidden="true"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Number bubble */}
                <div 
                  className="w-16 h-16 flex items-center justify-center rounded-full text-white font-bold text-xl mb-8 relative z-10"
                  style={{ backgroundColor: step.iconBg }}
                >
                  {step.number}
                </div>
                
                {/* Content */}
                <div className="bg-white p-6 rounded-xl shadow-md text-center h-full w-full">
                  <div className="mb-4 flex justify-center">
                    <step.icon size={32} color={step.iconBg} />
                  </div>
                  <h3 className="text-xl font-bold text-locaposty-text-dark mb-2">{step.title}</h3>
                  <p className="text-locaposty-text-medium">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
