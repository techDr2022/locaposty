"use client";
import React from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import QuickStats from "@/components/dashboard/QuickStats";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import UpcomingPosts from "@/components/dashboard/UpcomingPosts";
import ReviewSummary from "@/components/dashboard/ReviewSummary";
import GettingStarted from "@/components/dashboard/GettingStarted";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Mock data for the dashboard - in a real app, this would come from an API
  const userData = {
    name: "John Smith",
    business: "Smith's Cafe",
    location: "San Francisco, CA",
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-locaposty-text-dark">
              Welcome back, {userData.name}!
            </h1>
            <p className="text-locaposty-text-medium">
              Here&apos;s what&apos;s happening with {userData.business} in{" "}
              {userData.location}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-locaposty-primary text-locaposty-primary hover:bg-locaposty-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Post
            </Button>
            <Link href="/posts">
              <Button className="bg-locaposty-primary hover:bg-locaposty-primary/90">
                <Calendar className="mr-2 h-4 w-4" /> View Calendar
              </Button>
            </Link>
          </div>
        </header>

        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <ActivityTimeline />
            <UpcomingPosts className="mt-6" />
          </div>
          <div className="space-y-6">
            <ReviewSummary />
            <GettingStarted />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
