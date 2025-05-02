"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AutoReplySettings from "@/components/settings/AutoReplySettings";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

interface Location {
  id: string;
  name: string;
  gmbLocationName: string;
  autoReplyEnabled: boolean;
  autoPostEnabled: boolean;
  replyTonePreference: string;
  lastFetchedTimestamp: Date | null;
}

interface UpdateSettingsData {
  autoReplyEnabled: boolean;
  autoPostEnabled: boolean;
  replyTonePreference: string;
}

export default function ReviewsSettings() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/locations");
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }
        const data = await response.json();
        if (data.locations && Array.isArray(data.locations)) {
          setLocations(data.locations);
        } else {
          console.error("Invalid locations data format:", data);
          toast.error("Invalid data format received from server");
          setLocations([]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Failed to load locations");
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleUpdateSettings = async (
    locationId: string,
    settings: UpdateSettingsData
  ) => {
    try {
      const response = await fetch(`/api/locations/${locationId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          autoReplyEnabled: settings.autoReplyEnabled,
          autoPostEnabled: settings.autoPostEnabled,
          replyTonePreference: settings.replyTonePreference,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      // Update local state
      setLocations(
        locations.map((loc) =>
          loc.id === locationId ? { ...loc, ...settings } : loc
        )
      );

      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  const handleSyncNow = async (locationId: string) => {
    try {
      const response = await fetch(`/api/reviews/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync reviews");
      }

      const updatedResponse = await fetch("/api/locations");
      if (updatedResponse.ok) {
        const data = await updatedResponse.json();
        setLocations(data.locations);
      }

      return true;
    } catch (error) {
      console.error("Error syncing reviews:", error);
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col h-full">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-locaposty-text-dark">
            Review Management Settings
          </h1>
          <p className="text-locaposty-text-medium">
            Configure auto-reply and review management settings
          </p>
        </header>

        <Tabs defaultValue="auto-reply">
          <TabsList className="mb-4">
            <TabsTrigger value="auto-reply">Auto-Reply Settings</TabsTrigger>
            <TabsTrigger value="templates">Reply Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="auto-reply">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Reply Configuration</CardTitle>
                  <CardDescription>
                    Set up automatic replies for new Google reviews using AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure each location to automatically generate and
                    optionally post replies to new reviews. AI-generated
                    responses can be customized with different tones and styles.
                  </p>
                  <Separator className="my-6" />

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-locaposty-primary" />
                      <span className="ml-2">Loading locations...</span>
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No locations found. Please connect Google Business Profile
                      locations first.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {locations.map((location) => (
                        <AutoReplySettings
                          key={location.id}
                          locationId={location.id}
                          locationName={location.gmbLocationName}
                          isAutoReplyEnabled={location.autoReplyEnabled}
                          isAutoPostEnabled={location.autoPostEnabled}
                          replyTonePreference={location.replyTonePreference}
                          lastFetchedTimestamp={location.lastFetchedTimestamp}
                          onUpdateSettings={(settings) =>
                            handleUpdateSettings(location.id, settings)
                          }
                          onSyncNow={() => handleSyncNow(location.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Reply Templates</CardTitle>
                <CardDescription>
                  Create and manage templates for AI-generated replies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Template management coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
