import React from "react";
import { Calendar, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NoPostLocationsState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] max-w-2xl mx-auto text-center p-6">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Calendar className="h-8 w-8 text-locaposty-primary" />
      </div>

      <h1 className="text-2xl font-bold text-locaposty-text-dark mb-3">
        Connect a Location to Start Posting
      </h1>

      <p className="text-locaposty-text-medium mb-8 max-w-md">
        To create and schedule posts for your Google Business Profile, you need
        to connect at least one location first. This will allow you to manage
        all your content in one place.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/settings/locations/connect">
          <Button className="bg-locaposty-primary hover:bg-locaposty-primary/90">
            Connect Location
            <MapPin className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        <Link href="/dashboard">
          <Button variant="outline">
            Return to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-10 p-5 bg-blue-50 rounded-lg border border-blue-100 text-left max-w-md">
        <h3 className="font-medium text-locaposty-text-dark mb-2">
          Why create Google Business Profile posts?
        </h3>
        <ul className="space-y-2 text-sm text-locaposty-text-medium">
          <li>• Share updates, offers, and events directly with customers</li>
          <li>• Schedule posts in advance for consistent content delivery</li>
          <li>
            • Increase visibility of your business on Google Search and Maps
          </li>
          <li>• Drive more engagement and attract new customers</li>
        </ul>
      </div>
    </div>
  );
};

export default NoPostLocationsState;
