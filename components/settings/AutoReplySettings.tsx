"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, RefreshCw } from "lucide-react";

interface AutoReplySettingsProps {
  locationId: string;
  locationName: string;
  isAutoReplyEnabled: boolean;
  isAutoPostEnabled: boolean;
  replyTonePreference: string;
  lastFetchedTimestamp: Date | null;
  onUpdateSettings: (settings: {
    autoReplyEnabled: boolean;
    autoPostEnabled: boolean;
    replyTonePreference: string;
  }) => Promise<boolean>;
  onSyncNow: () => Promise<boolean>;
}

const AutoReplySettings: React.FC<AutoReplySettingsProps> = ({
  locationId,
  locationName,
  isAutoReplyEnabled = false,
  isAutoPostEnabled = false,
  replyTonePreference = "FRIENDLY",
  lastFetchedTimestamp,
  onUpdateSettings,
  onSyncNow,
}) => {
  const [autoReplyEnabled, setAutoReplyEnabled] =
    useState(!!isAutoReplyEnabled);
  const [autoPostEnabled, setAutoPostEnabled] = useState(!!isAutoPostEnabled);
  const [tonePreference, setTonePreference] = useState(
    replyTonePreference || "FRIENDLY"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({
        autoReplyEnabled,
        autoPostEnabled,
        replyTonePreference: tonePreference,
      });
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await onSyncNow();
      toast.success("Reviews synced successfully");
    } catch (error) {
      console.error("Failed to sync reviews:", error);
      toast.error("Failed to sync reviews");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSynced = () => {
    if (!lastFetchedTimestamp) return "Never";
    try {
      return new Date(lastFetchedTimestamp).toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Never";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Auto-Reply Settings for {locationName}</span>
          <Badge variant="outline" className="ml-2">
            {locationId}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure how the system should handle review responses for this
          location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-reply" className="text-base">
                Enable Auto-Reply
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate AI replies for new reviews
              </p>
            </div>
            <Switch
              id="auto-reply"
              checked={autoReplyEnabled}
              onCheckedChange={setAutoReplyEnabled}
            />
          </div>

          {autoReplyEnabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-post" className="text-base">
                    Enable Auto-Post
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically post AI-generated replies without manual
                    review
                  </p>
                </div>
                <Switch
                  id="auto-post"
                  checked={autoPostEnabled}
                  onCheckedChange={setAutoPostEnabled}
                />
              </div>

              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tone" className="text-base">
                    Reply Tone
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select the preferred tone for AI-generated replies
                  </p>
                </div>
                <Select
                  value={tonePreference}
                  onValueChange={setTonePreference}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRIENDLY">Friendly</SelectItem>
                    <SelectItem value="FORMAL">Formal</SelectItem>
                    <SelectItem value="APOLOGETIC">Apologetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Last Synced</Label>
              <p className="text-sm text-muted-foreground">
                {formatLastSynced()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              Sync Now
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Info className="mr-2 h-4 w-4" />
          Changes will take effect immediately
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AutoReplySettings;
