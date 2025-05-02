"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GoogleBusinessLogo from "@/components/svg/GoogleBusinessLogo";

// Define types
interface GMBAccount {
  name: string;
  accountName: string;
  type: string;
  role: string;
  state: string;
}

interface GMBLocation {
  name: string;
  title: string;
  websiteUri?: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    country: string;
  };
  phoneNumbers?: {
    primaryPhone?: string;
  };
  selected?: boolean;
}

const ConnectGMBClient = () => {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accounts, setAccounts] = useState<GMBAccount[]>([]);
  const [locations, setLocations] = useState<GMBLocation[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [step, setStep] = useState<
    "connect" | "accounts" | "locations" | "success"
  >("connect");

  // Check if user is already connected to Google
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/google/auth/check");
          const data = await response.json();

          if (data.isConnected) {
            setStep("accounts");
            fetchAccounts();
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error checking Google connection:", error);
          setIsLoading(false);
        }
      } else if (status === "unauthenticated") {
        router.push("/login");
      }
    };

    checkGoogleConnection();
  }, [status, router]);

  // Fetch GMB accounts
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/google/mybusiness/accounts");

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch Google Business accounts");
      setIsLoading(false);
    }
  };

  // Fetch locations for selected account
  const fetchLocations = async (accountId: string) => {
    try {
      setIsLoading(true);
      console.log(`Fetching locations for account: ${accountId}`);

      if (!accountId) {
        throw new Error("Account ID is required");
      }

      const response = await fetch(
        `/api/google/mybusiness/locations?accountId=${encodeURIComponent(accountId)}`
      );

      console.log("Location API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Location API error response:", errorText);
        throw new Error(
          `Failed to fetch locations: ${response.statusText || errorText}`
        );
      }

      const data = await response.json();
      console.log(`Received ${data.locations?.length || 0} locations`);

      setLocations(data.locations || []);
      setStep("locations");
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch locations"
      );
      setIsLoading(false);
    }
  };

  // Handle connecting to Google
  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch("/api/google/auth/connect");

      if (!response.ok) {
        throw new Error("Failed to start Google connection");
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error connecting to Google:", error);
      toast.error("Failed to connect to Google");
      setIsConnecting(false);
    }
  };

  // Handle account selection
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccount(accountId);
    fetchLocations(accountId);
  };

  // Handle location toggle
  const handleLocationToggle = (locationName: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(locationName)) {
        return prev.filter((name) => name !== locationName);
      } else {
        return [...prev, locationName];
      }
    });
  };

  // Handle save locations
  const handleSaveLocations = async () => {
    try {
      setIsLoading(true);

      if (selectedLocations.length === 0) {
        toast.error("Please select at least one location");
        setIsLoading(false);
        return;
      }

      console.log(
        `Saving ${selectedLocations.length} locations from account ${selectedAccount}`
      );

      // Get the selected location objects
      const locationsToSave = locations.filter((loc) =>
        selectedLocations.includes(loc.name)
      );

      console.log(
        "Locations to save:",
        locationsToSave.map((loc) => loc.title)
      );

      const response = await fetch("/api/google/mybusiness/save-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          locations: locationsToSave,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Failed to save locations:", responseData);
        throw new Error(responseData.error || "Failed to save locations");
      }

      console.log("Save locations response:", responseData);

      setStep("success");
      toast.success(
        `${responseData.message || "Locations connected successfully!"}`
      );
      setIsLoading(false);

      // Get the referring path from localStorage or default to dashboard
      const referringPath =
        localStorage.getItem("referringPath") || "/dashboard";

      // Redirect to the referring page after success
      setTimeout(() => {
        router.push(referringPath);
        // Clear the stored path after successful redirection
        localStorage.removeItem("referringPath");
      }, 3000);
    } catch (error) {
      console.error("Error saving locations:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save locations"
      );
      setIsLoading(false);
    }
  };

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case "connect":
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center mb-4">
                <GoogleBusinessLogo className="h-8 w-8 mr-3" />
                <CardTitle className="text-2xl">
                  Connect Google Business Profile
                </CardTitle>
              </div>
              <CardDescription>
                Connect your Google Business Profiles to manage posts, reviews,
                and insights in one place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  LocaPosty needs access to your Google Business Profile to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Schedule and publish posts directly to your profiles</li>
                  <li>Monitor and respond to customer reviews</li>
                  <li>Track performance metrics and insights</li>
                  <li>Manage business information across multiple locations</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Settings
                </Link>
              </Button>
              <Button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="bg-locaposty-primary hover:bg-locaposty-primary/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <GoogleBusinessLogo className="mr-2 h-4 w-4" />
                    Connect with Google
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );

      case "accounts":
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center mb-4">
                <GoogleBusinessLogo className="h-8 w-8 mr-3" />
                <CardTitle className="text-2xl">
                  Select a Business Account
                </CardTitle>
              </div>
              <CardDescription>
                Choose the Google Business account you want to connect with
                LocaPosty.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No business accounts found. Please make sure you have access
                    to Google Business Profile accounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.name}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAccount === account.name
                          ? "border-locaposty-primary bg-locaposty-primary/5"
                          : "hover:border-locaposty-primary/50"
                      }`}
                      onClick={() => handleSelectAccount(account.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{account.accountName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Role: {account.role} • Type: {account.type}
                          </p>
                        </div>
                        {selectedAccount === account.name && (
                          <Check className="h-5 w-5 text-locaposty-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("connect")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() =>
                  selectedAccount && fetchLocations(selectedAccount)
                }
                disabled={!selectedAccount || isLoading}
                className="bg-locaposty-primary hover:bg-locaposty-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Continue to Locations"
                )}
              </Button>
            </CardFooter>
          </Card>
        );

      case "locations":
        return (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <div className="flex items-center mb-4">
                <GoogleBusinessLogo className="h-8 w-8 mr-3" />
                <CardTitle className="text-2xl">Select Locations</CardTitle>
              </div>
              <CardDescription>
                Choose which business locations you want to manage with
                LocaPosty.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No locations found for this account.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">
                      {selectedLocations.length} of {locations.length} selected
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedLocations.length === locations.length) {
                          setSelectedLocations([]);
                        } else {
                          setSelectedLocations(
                            locations.map((loc) => loc.name)
                          );
                        }
                      }}
                    >
                      {selectedLocations.length === locations.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    {locations.map((location) => (
                      <div
                        key={location.name}
                        className={`p-4 border rounded-lg mb-3 ${
                          selectedLocations.includes(location.name)
                            ? "border-locaposty-primary bg-locaposty-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <Checkbox
                            id={location.name}
                            checked={selectedLocations.includes(location.name)}
                            onCheckedChange={() =>
                              handleLocationToggle(location.name)
                            }
                            className="mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <Label
                              htmlFor={location.name}
                              className="text-base font-medium cursor-pointer"
                            >
                              {location.title}
                            </Label>

                            {location.storefrontAddress && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {location.storefrontAddress.addressLines.join(
                                  ", "
                                )}
                                , {location.storefrontAddress.locality},{" "}
                                {location.storefrontAddress.administrativeArea}{" "}
                                {location.storefrontAddress.postalCode}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mt-2">
                              {location.phoneNumbers?.primaryPhone && (
                                <Badge variant="outline" className="text-xs">
                                  {location.phoneNumbers.primaryPhone}
                                </Badge>
                              )}
                              {location.websiteUri && (
                                <Badge variant="outline" className="text-xs">
                                  Website
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("accounts")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Accounts
              </Button>
              <Button
                onClick={handleSaveLocations}
                disabled={selectedLocations.length === 0 || isLoading}
                className="bg-locaposty-primary hover:bg-locaposty-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Connect Locations"
                )}
              </Button>
            </CardFooter>
          </Card>
        );

      case "success":
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl ml-3">
                  Connection Successful!
                </CardTitle>
              </div>
              <CardDescription>
                Your Google Business Profile locations have been connected to
                LocaPosty.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p>
                  You can now manage posts, reviews, and insights for your
                  connected locations.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting to dashboard...
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button
                asChild
                className="bg-locaposty-primary hover:bg-locaposty-primary/90"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <DashboardLayout showLocationSelector={false}>
      <div className="flex justify-center p-6">
        {isLoading && step === "connect" ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-locaposty-primary" />
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConnectGMBClient;
