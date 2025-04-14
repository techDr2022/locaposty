
import React from 'react';
import { Calendar, MessageSquare, BarChart3 } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      title: "Post Scheduler",
      description: "Schedule posts weeks in advance with our intuitive calendar interface. Set it and forget it with recurring posts.",
      icon: Calendar,
      iconColor: "#1E56A0"
    },
    {
      title: "AI Review Management",
      description: "Respond to customer reviews quickly with AI-generated responses that you can edit before sending.",
      icon: MessageSquare,
      iconColor: "#F76E11"
    },
    {
      title: "Performance Reports",
      description: "Track engagement, visibility, and conversion metrics with beautiful, easy-to-understand visual reports.",
      icon: BarChart3,
      iconColor: "#1E56A0"
    }
  ];

  return (
    <section id="features" className="bg-white py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            Key Features That <span className="text-locaposty-primary">Set Us Apart</span>
          </h2>
          <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto">
            Our platform is designed to save you time while maximizing your Google Business Profile performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 flex items-center justify-center rounded-full mb-6"
                style={{ backgroundColor: `${feature.iconColor}15` }}
              >
                <feature.icon size={32} color={feature.iconColor} />
              </div>
              <h3 className="text-xl font-bold text-locaposty-text-dark mb-3">{feature.title}</h3>
              <p className="text-locaposty-text-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
