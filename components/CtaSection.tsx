"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CtaSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    locations: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.locations) {
      newErrors.locations = "Please select number of locations";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Demo request submitted successfully! We&apos;ll be in touch soon."
        );
        setFormData({
          name: "",
          email: "",
          businessName: "",
          locations: "",
        });
      } else {
        toast.error(
          data.message || "Failed to submit request. Please try again."
        );
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-locaposty-primary to-locaposty-primary/80 py-20 text-white">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to supercharge your Google Business presence?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Join thousands of businesses that are saving time and increasing
              engagement with LocaPosty&apos;s automated tools and AI
              assistance.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Start your 7-day free trial today. No credit card required.",
                "Full access to all features during your trial.",
                "Cancel anytime with no obligation.",
                "Dedicated onboarding support to help you get started.",
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
            <h3 className="text-2xl font-bold mb-6">
              Get in touch with our team
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/20 border ${errors.name ? "border-red-400" : "border-white/30"} placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50`}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="text-red-300 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/20 border ${errors.email ? "border-red-400" : "border-white/30"} placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-300 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/20 border ${errors.businessName ? "border-red-400" : "border-white/30"} placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50`}
                  placeholder="Your business name"
                />
                {errors.businessName && (
                  <p className="text-red-300 text-sm mt-1">
                    {errors.businessName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-90">
                  Number of Locations
                </label>
                <select
                  name="locations"
                  value={formData.locations}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/20 border ${errors.locations ? "border-red-400" : "border-white/30"} text-white focus:outline-none focus:ring-2 focus:ring-white/50`}
                >
                  <option value="" className="bg-locaposty-primary">
                    Select number of locations
                  </option>
                  <option value="1" className="bg-locaposty-primary">
                    1 location
                  </option>
                  <option value="2-5" className="bg-locaposty-primary">
                    2-5 locations
                  </option>
                  <option value="6-10" className="bg-locaposty-primary">
                    6-10 locations
                  </option>
                  <option value="11+" className="bg-locaposty-primary">
                    11+ locations
                  </option>
                </select>
                {errors.locations && (
                  <p className="text-red-300 text-sm mt-1">
                    {errors.locations}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-locaposty-secondary hover:bg-locaposty-secondary/90 text-white transition-colors py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Request Demo"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
