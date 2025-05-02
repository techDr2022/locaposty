import React from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NoLocationsState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] max-w-2xl mx-auto text-center p-6">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <MapPin className="h-8 w-8 text-locaposty-primary" />
      </div>

      <h1 className="text-2xl font-bold text-locaposty-text-dark mb-3">
        Connect Your Google Business Profile
      </h1>

      <p className="text-locaposty-text-medium mb-8 max-w-md">
        To get started with LocaPosty, you need to connect at least one Google
        Business Profile location. This will allow you to manage posts, reviews,
        and insights.
      </p>

      <Link href="/settings/locations/connect">
        <Button className="bg-locaposty-primary hover:bg-locaposty-primary/90">
          Connect Google Business Profile
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>

      <div className="mt-10 p-5 bg-blue-50 rounded-lg border border-blue-100 text-left max-w-md">
        <h3 className="font-medium text-locaposty-text-dark mb-2">
          Why connect your Google Business Profile?
        </h3>
        <ul className="space-y-2 text-sm text-locaposty-text-medium">
          <li>
            • Schedule and publish posts directly to your Google Business
            Profile
          </li>
          <li>• Manage and respond to customer reviews with AI assistance</li>
          <li>• Track location performance with detailed analytics</li>
          <li>• Maintain consistent business information across locations</li>
        </ul>
      </div>
    </div>
  );
};

export default NoLocationsState;
