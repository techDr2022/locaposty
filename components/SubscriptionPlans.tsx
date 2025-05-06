"use client";

import { useState, useEffect } from "react";
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
import { Check } from "lucide-react";
import Script from "next/script";

// Subscription plan details
const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 999,
    priceDisplay: "₹999/month",
    trialDays: 14,
    planType: "BASIC",
    features: [
      "Up to 5 locations",
      "Review monitoring",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 1999,
    priceDisplay: "₹1,999/month",
    trialDays: 14,
    planType: "PREMIUM",
    features: [
      "Up to 15 locations",
      "Advanced analytics",
      "AI-powered review responses",
      "Priority support",
      "Post scheduling",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 4999,
    priceDisplay: "₹4,999/month",
    trialDays: 14,
    planType: "ENTERPRISE",
    features: [
      "Unlimited locations",
      "Advanced analytics & reports",
      "Custom AI templates",
      "Dedicated account manager",
      "API access",
      "White-label reports",
    ],
  },
];

export default function SubscriptionPlans() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Razorpay is loaded
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Get user subscription status on component mount
  useEffect(() => {
    if (session?.user) {
      fetch("/api/subscriptions/status")
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setUserSubscription(data.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching subscription status:", err);
        });
    }
  }, [session]);

  // Start free trial - this creates a subscription with the trial period
  const startFreeTrial = async (planType: string) => {
    if (!session?.user) {
      // Redirect to login with plan parameter for OAuth flow
      router.push(`/login?plan=${planType}&callbackUrl=/dashboard`);
      return;
    }

    setIsLoading(planType);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/create-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to start free trial");
      }

      setUserSubscription(result.data);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error starting trial:", error);
      setError(error instanceof Error ? error.message : "An error occurred");

      // Still redirect to dashboard after a delay, even if there was an error
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } finally {
      setIsLoading(null);
    }
  };

  // Handle purchase after trial
  const handlePayment = (plan: any) => {
    if (!isRazorpayLoaded) {
      setError("Payment system is loading. Please try again.");
      return;
    }

    if (!session?.user) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setIsLoading(plan.planType);

    // Configure Razorpay options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscription_id: userSubscription?.subscriptionId,
      name: "LocaPosty",
      description: `${plan.name} Plan Subscription`,
      handler: async function (response: any) {
        // Handle successful payment
        try {
          const verifyResponse = await fetch(
            "/api/subscriptions/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_subscription_id: userSubscription?.subscriptionId,
                userId: session.user.id,
              }),
            }
          );

          const result = await verifyResponse.json();

          if (result.success) {
            // Update user subscription in state
            setUserSubscription(result.data);
            router.push("/dashboard");
          } else {
            setError(result.message || "Payment verification failed");
          }
        } catch (error) {
          setError("Failed to verify payment");
        } finally {
          setIsLoading(null);
        }
      },
      prefill: {
        name: session.user.name,
        email: session.user.email,
      },
      theme: {
        color: "#7c3aed",
      },
    };

    // Create Razorpay instance and open checkout
    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  // Render button based on subscription status
  const renderActionButton = (plan: any) => {
    // If no user is logged in
    if (!session?.user) {
      return (
        <Button
          className="w-full"
          onClick={() => startFreeTrial(plan.planType)}
          disabled={isLoading === plan.planType}
        >
          {isLoading === plan.planType
            ? "Loading..."
            : `Start ${plan.trialDays}-Day Free Trial`}
        </Button>
      );
    }

    // If user has a subscription
    if (userSubscription) {
      // If on free trial for this plan
      if (
        userSubscription.status === "TRIALING" &&
        userSubscription.plan === plan.planType
      ) {
        return (
          <Button
            className="w-full"
            onClick={() => handlePayment(plan)}
            disabled={isLoading === plan.planType}
          >
            {isLoading === plan.planType ? "Processing..." : "Subscribe Now"}
          </Button>
        );
      }

      // If active subscription for this plan
      if (
        userSubscription.status === "ACTIVE" &&
        userSubscription.plan === plan.planType
      ) {
        return (
          <Button className="w-full" variant="outline" disabled>
            Current Plan
          </Button>
        );
      }

      // If has another plan (either trial or active)
      return (
        <Button
          className="w-full"
          variant="outline"
          disabled={isLoading === plan.planType}
          onClick={() => handlePayment(plan)}
        >
          {isLoading === plan.planType ? "Processing..." : "Switch Plan"}
        </Button>
      );
    }

    // Default - no subscription yet
    return (
      <Button
        className="w-full"
        onClick={() => startFreeTrial(plan.planType)}
        disabled={isLoading === plan.planType}
      >
        {isLoading === plan.planType
          ? "Loading..."
          : `Start ${plan.trialDays}-Day Free Trial`}
      </Button>
    );
  };

  return (
    <>
      {/* Razorpay Script */}
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsRazorpayLoaded(true)}
      />

      <div className="container mx-auto py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            All plans include a {plans[0].trialDays}-day free trial. No credit
            card required.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {plan.priceDisplay}
                    </span>
                    <span className="text-muted-foreground"> after trial</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>{renderActionButton(plan)}</CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
