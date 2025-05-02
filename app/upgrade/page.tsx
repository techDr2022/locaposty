"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { Loader2 } from "lucide-react";

// Extract the component that uses useSearchParams
const UpgradeContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [daysExpired, setDaysExpired] = useState<number | null>(null);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // If user has an active subscription, redirect back to the original page
    if (
      session?.user?.subscriptionStatus === "ACTIVE" ||
      (session?.user?.subscriptionStatus === "TRIALING" &&
        session?.user?.trialEndsAt &&
        new Date(session.user.trialEndsAt) > new Date())
    ) {
      router.push(callbackUrl);
    }

    // Calculate days since trial expired
    if (
      session?.user?.subscriptionStatus === "PAST_DUE" ||
      session?.user?.subscriptionStatus === "EXPIRED"
    ) {
      if (session.user.trialEndsAt) {
        const trialEnd = new Date(session.user.trialEndsAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - trialEnd.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysExpired(diffDays);
      }
    }
  }, [session, status, router, callbackUrl]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Your Trial Has Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            {daysExpired
              ? `Your trial period ended ${daysExpired} ${
                  daysExpired === 1 ? "day" : "days"
                } ago.`
              : "Your trial period has ended."}
          </p>
          <p className="mb-6">
            To continue using all features of LocaPosty, please choose a
            subscription plan below.
          </p>
          {session.user.subscriptionPlan && (
            <div className="bg-muted p-4 rounded-md mb-6">
              <p className="font-medium">
                Your previous plan:{" "}
                <span className="text-primary">
                  {session.user.subscriptionPlan}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                We recommend continuing with the same plan to maintain access to
                all features you&apos;re familiar with.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionPlans />
    </div>
  );
};

// Main page component with Suspense boundary
export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <UpgradeContent />
    </Suspense>
  );
}
