"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/"
              className="text-2xl font-bold text-locaposty-primary flex items-center"
            >
              <span className="text-locaposty-secondary">Loca</span>
              Posty
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-10">
            <a
              href="#features"
              className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="text-locaposty-primary border-locaposty-primary hover:bg-locaposty-accent hover:text-locaposty-primary"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push(`/signup`)}
              className="bg-locaposty-secondary text-white hover:bg-locaposty-secondary/90"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-locaposty-text-dark focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <a
                href="#features"
                className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-locaposty-text-medium hover:text-locaposty-primary transition-colors"
              >
                FAQ
              </a>
              <div className="flex flex-col space-y-2 pt-2">
                <Button
                  onClick={() => router.push("/login")}
                  variant="outline"
                  className="text-locaposty-primary border-locaposty-primary w-full justify-center"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="bg-locaposty-secondary text-white hover:bg-locaposty-secondary/90"
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
