"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const pricingPlans = [
    {
      name: "Free",
      description: "Perfect for individuals just getting started",
      price: {
        monthly: 0,
        annual: 0,
      },
      features: [
        "1 Google Business Profile",
        "5 scheduled posts per month",
        "Basic review management",
        "Simple performance metrics",
        "Email support",
      ],
      cta: "Get Started",
      isPopular: false,
      ctaColor: "bg-locaposty-text-medium",
    },
    {
      name: "Standard",
      description: "Ideal for small businesses",
      price: {
        monthly: 29,
        annual: 24,
      },
      features: [
        "Up to 3 Google Business Profiles",
        "Unlimited scheduled posts",
        "AI review response suggestions",
        "Advanced analytics dashboard",
        "Priority email support",
        "Team collaboration (1 user)",
      ],
      cta: "Start Trial",
      isPopular: true,
      ctaColor: "bg-locaposty-secondary",
    },
    {
      name: "Pro",
      description: "For growing businesses with multiple locations",
      price: {
        monthly: 79,
        annual: 64,
      },
      features: [
        "Up to 10 Google Business Profiles",
        "Unlimited scheduled posts",
        "Advanced AI review management",
        "Custom performance reports",
        "Priority phone & email support",
        "Team collaboration (5 users)",
        "White labeling options",
        "API access",
      ],
      cta: "Start Trial",
      isPopular: false,
      ctaColor: "bg-locaposty-primary",
    },
  ];

  return (
    <section id="pricing" className="bg-white py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            Simple, Transparent{" "}
            <span className="text-locaposty-primary">Pricing</span>
          </h2>
          <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto mb-8">
            Choose the plan that works best for your business needs.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span
              className={`text-sm font-medium ${
                !isAnnual
                  ? "text-locaposty-text-dark"
                  : "text-locaposty-text-medium"
              }`}
            >
              Monthly
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <div className="flex items-center">
              <span
                className={`text-sm font-medium ${
                  isAnnual
                    ? "text-locaposty-text-dark"
                    : "text-locaposty-text-medium"
                }`}
              >
                Annual
              </span>
              <span className="ml-2 bg-locaposty-secondary/20 text-locaposty-secondary text-xs font-medium px-2 py-0.5 rounded">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.isPopular
                  ? "border-2 border-locaposty-secondary shadow-lg"
                  : "border border-gray-200"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-locaposty-secondary text-white text-sm font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-locaposty-text-dark mb-2">
                  {plan.name}
                </h3>
                <p className="text-locaposty-text-medium">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-locaposty-text-dark">
                    ${isAnnual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-locaposty-text-medium">/month</span>
                </div>
                {isAnnual && plan.price.annual > 0 && (
                  <div className="text-sm text-locaposty-text-medium mt-1">
                    Billed annually (${plan.price.annual * 12}/year)
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <Check
                      size={20}
                      className="mr-2 text-green-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-locaposty-text-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-locaposty-text-medium">
          <p>All plans include a 14-day free trial. No credit card required.</p>
          <p className="mt-2">
            Need a custom plan for multiple locations?{" "}
            <a
              href="#"
              className="text-locaposty-primary font-medium hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
