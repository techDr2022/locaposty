import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
        <div className="text-center py-8">
          <Link
            to="/dashboard"
            className="inline-block bg-locaposty-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            View Dashboard Demo
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
