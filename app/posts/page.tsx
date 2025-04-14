"use client";
import React, { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Tag,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarListView from "@/components/calendar/CalendarListView";
import CalendarSidePanel from "@/components/calendar/CalendarSidePanel";
import CreatePostModal from "@/components/calendar/CreatePostModal";
import BulkOperationsPanel from "@/components/calendar/BulkOperationsPanel";
import { mockPosts } from "@/data/mockCalendarData";

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLocationFilter, setSelectedLocationFilter] =
    useState<string>("all");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([
    "whatsnew",
    "event",
    "offer",
  ]);
  const [posts, setPosts] = useState(mockPosts);

  const filteredPosts = posts.filter((post) => {
    const matchesLocation =
      selectedLocationFilter === "all" ||
      post.location === selectedLocationFilter;
    const matchesType = selectedTypeFilters.includes(post.type);
    return matchesLocation && matchesType;
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleCreatePost = () => {
    setIsCreateModalOpen(true);
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const clearSelection = () => {
    setSelectedPosts([]);
  };

  const toggleSidePanel = () => {
    setShowSidePanel((prev) => !prev);
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col h-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-locaposty-text-dark">
              Content Calendar
            </h1>
            <p className="text-locaposty-text-medium">
              Manage and schedule your Google Business Profile posts
            </p>
          </div>
          <Button
            onClick={handleCreatePost}
            size="sm"
            className="bg-locaposty-primary hover:bg-locaposty-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Tabs
                defaultValue={view}
                onValueChange={(v) => setView(v as "month" | "week" | "list")}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="month">
                    <LayoutGrid className="h-4 w-4 mr-2" /> Month
                  </TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" /> List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center ml-0 sm:ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="mx-2 font-medium">
                  {format(currentDate, "MMMM yyyy")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Location
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocationFilter === "all"}
                    onCheckedChange={() => setSelectedLocationFilter("all")}
                  >
                    All Locations
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocationFilter === "sf"}
                    onCheckedChange={() => setSelectedLocationFilter("sf")}
                  >
                    San Francisco
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocationFilter === "nyc"}
                    onCheckedChange={() => setSelectedLocationFilter("nyc")}
                  >
                    New York
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLocationFilter === "la"}
                    onCheckedChange={() => setSelectedLocationFilter("la")}
                  >
                    Los Angeles
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Tag className="mr-2 h-4 w-4" /> Post Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypeFilters.includes("whatsnew")}
                    onCheckedChange={() => {
                      setSelectedTypeFilters((prev) =>
                        prev.includes("whatsnew")
                          ? prev.filter((type) => type !== "whatsnew")
                          : [...prev, "whatsnew"]
                      );
                    }}
                  >
                    What's New
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypeFilters.includes("event")}
                    onCheckedChange={() => {
                      setSelectedTypeFilters((prev) =>
                        prev.includes("event")
                          ? prev.filter((type) => type !== "event")
                          : [...prev, "event"]
                      );
                    }}
                  >
                    Events
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypeFilters.includes("offer")}
                    onCheckedChange={() => {
                      setSelectedTypeFilters((prev) =>
                        prev.includes("offer")
                          ? prev.filter((type) => type !== "offer")
                          : [...prev, "offer"]
                      );
                    }}
                  >
                    Offers
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {selectedPosts.length > 0 && (
          <BulkOperationsPanel
            selectedCount={selectedPosts.length}
            onClearSelection={clearSelection}
          />
        )}

        <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
          <div className="flex-grow overflow-auto">
            {view === "month" && (
              <CalendarGrid
                currentDate={currentDate}
                posts={filteredPosts}
                onSelectPost={togglePostSelection}
                selectedPosts={selectedPosts}
              />
            )}
            {view === "week" && (
              <div className="p-16 text-center text-gray-500 italic">
                Week view implementation coming soon...
              </div>
            )}
            {view === "list" && (
              <CalendarListView
                currentDate={currentDate}
                posts={filteredPosts}
                onSelectPost={togglePostSelection}
                selectedPosts={selectedPosts}
              />
            )}
          </div>

          {showSidePanel && (
            <CalendarSidePanel
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              upcomingPosts={filteredPosts
                .filter((post) => new Date(post.scheduledFor) >= new Date())
                .sort(
                  (a, b) =>
                    new Date(a.scheduledFor).getTime() -
                    new Date(b.scheduledFor).getTime()
                )
                .slice(0, 5)}
              toggleSidePanel={toggleSidePanel}
            />
          )}
        </div>

        {!showSidePanel && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-6 right-6 z-10 rounded-full shadow-md"
            onClick={toggleSidePanel}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        )}

        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
