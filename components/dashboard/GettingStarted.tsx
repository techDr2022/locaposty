import React from "react";
import { Check, HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  linkHref?: string;
}

interface GettingStartedProps {
  steps?: SetupStep[];
}

const GettingStarted: React.FC<GettingStartedProps> = ({ steps }) => {
  // Default steps when none are provided
  const defaultSteps: SetupStep[] = [
    {
      id: 1,
      title: "Connect Google Business Profile",
      description:
        "Link your Google Business profile to enable posting and review management.",
      completed: false,
      linkHref: "/settings/locations/connect",
    },
    {
      id: 2,
      title: "Complete Business Information",
      description: "Add business hours, description, and contact details.",
      completed: false,
      linkHref: "/settings/profile",
    },
    {
      id: 3,
      title: "Schedule Your First Post",
      description:
        "Create and schedule your first post to appear on your profile.",
      completed: false,
      linkHref: "/posts/new",
    },
    {
      id: 4,
      title: "Set Up Review Management",
      description: "Configure AI reply templates to automate review responses.",
      completed: false,
      linkHref: "/reviews/templates",
    },
  ];

  // Use provided steps or default steps
  const setupSteps = steps || defaultSteps;
  const completedSteps = setupSteps.filter((step) => step.completed).length;
  const progress = (completedSteps / setupSteps.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-locaposty-text-dark">
          Getting Started
        </h2>
        <div className="text-sm text-locaposty-text-medium">
          {completedSteps}/{setupSteps.length} Completed
        </div>
      </div>

      <div className="p-4">
        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div
            className="bg-locaposty-primary h-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Steps list */}
        <div className="space-y-4">
          {setupSteps.map((step) => (
            <div key={step.id} className="flex items-start">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                {step.completed ? (
                  <Check size={14} />
                ) : (
                  <span className="text-xs font-medium">{step.id}</span>
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`text-sm font-medium ${step.completed ? "text-locaposty-text-medium line-through" : "text-locaposty-text-dark"}`}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-locaposty-text-medium mt-1">
                  {step.description}
                </p>
                {!step.completed && step.linkHref && (
                  <Link href={step.linkHref}>
                    <Button
                      size="sm"
                      variant="link"
                      className="text-locaposty-primary p-0 h-auto text-xs mt-1"
                    >
                      Start this step
                      <ExternalLink size={10} className="ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-100 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-locaposty-text-medium"
        >
          <HelpCircle size={16} className="mr-1" />
          View Tutorial
        </Button>
        <Link
          href={
            setupSteps.find((step) => !step.completed)?.linkHref || "/dashboard"
          }
        >
          <Button
            size="sm"
            className="bg-locaposty-primary hover:bg-locaposty-primary/90"
          >
            Continue Setup
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default GettingStarted;
