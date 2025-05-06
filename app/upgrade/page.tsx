"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Check,
  X,
} from "lucide-react";
import Script from "next/script";

// Extract the component that uses useSearchParams
const UpgradeContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [daysExpired, setDaysExpired] = useState<number | null>(null);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(
    null
  );
  const [pageType, setPageType] = useState<
    "TRIAL_EXPIRED" | "TRIAL_EXPIRING" | "PLAN_UPGRADE"
  >("TRIAL_EXPIRED");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("IN");

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (session?.user) {
      setCurrentPlan(session.user.subscriptionPlan || null);

      // Check if user is on a paid plan wanting to upgrade
      if (
        session.user.subscriptionStatus === "ACTIVE" &&
        session.user.subscriptionPlan !== "ENTERPRISE"
      ) {
        setPageType("PLAN_UPGRADE");
        return;
      }

      // Calculate days until trial expires (if trial is still active)
      if (
        session.user.subscriptionStatus === "TRIALING" &&
        session.user.trialEndsAt
      ) {
        const trialEnd = new Date(session.user.trialEndsAt);
        const now = new Date();

        // If trial end date is in the future
        if (trialEnd > now) {
          const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysUntilExpiration(diffDays);
          setPageType("TRIAL_EXPIRING");
          return;
        }
      }

      // Calculate days since trial expired (if already expired)
      if (
        (session.user.subscriptionStatus === "PAST_DUE" ||
          session.user.subscriptionStatus === "EXPIRED") &&
        session.user.trialEndsAt
      ) {
        const trialEnd = new Date(session.user.trialEndsAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - trialEnd.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysExpired(diffDays);
        setPageType("TRIAL_EXPIRED");
      }
    }

    // Check if we have a cached country in localStorage
    const fetchUserCountry = () => {
      try {
        const cachedCountry = localStorage.getItem("user_country");
        if (cachedCountry) {
          setUserCountry(cachedCountry);
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      }
    };

    fetchUserCountry();
  }, [session, status, router, callbackUrl]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading your account information...</p>
      </div>
    );
  }

  // Pricing plans data
  const pricingPlans = [
    {
      name: "🌱 Basic",
      planType: "BASIC",
      description: "Perfect for small businesses just getting started",
      price: {
        monthly: userCountry === "IN" ? 2999 : 35,
        annual: userCountry === "IN" ? 2999 * 0.8 : 35 * 0.8, // 20% discount for annual
        display: userCountry === "IN" ? "₹" : "$",
      },
      features: [
        { name: "GMB Listings", value: "10" },
        { name: "GMB Posts", value: "15 per location/month" },
        { name: "Reports / Insights", value: true },
        { name: "Review Response Automation", value: false },
        { name: "GMB AI Assistant", value: false },
        { name: "Geo-Grid Rank Tracking", value: false },
        { name: "White-label Reports", value: false },
        { name: "Team Access", value: false },
        { name: "Turbo Post (AI Auto Scheduler)", value: false },
        { name: "Support", value: "Basic" },
        { name: "Free Trial", value: "7 Days" },
      ],
      cta: "Select Plan",
      isPopular: false,
      ctaColor: "bg-locaposty-primary",
      isRecommended: currentPlan === "BASIC",
    },
    {
      name: "🏛️ Standard",
      planType: "PREMIUM",
      description: "For businesses looking to grow and scale",
      price: {
        monthly: userCountry === "IN" ? 5999 : 70,
        annual: userCountry === "IN" ? 5999 * 0.8 : 70 * 0.8, // 20% discount for annual
        display: userCountry === "IN" ? "₹" : "$",
      },
      features: [
        { name: "GMB Listings", value: "25" },
        { name: "GMB Posts", value: "30 per location/month" },
        { name: "Reports / Insights", value: true },
        { name: "Review Response Automation", value: true },
        { name: "GMB AI Assistant", value: "Tips & Suggestions" },
        { name: "Geo-Grid Rank Tracking", value: "10 Keywords" },
        { name: "White-label Reports", value: false },
        { name: "Team Access", value: false },
        { name: "Turbo Post (AI Auto Scheduler)", value: false },
        { name: "Support", value: "Priority" },
        { name: "Free Trial", value: "7 Days" },
      ],
      cta: "Select Plan",
      isPopular: true,
      ctaColor: "bg-locaposty-secondary",
      isRecommended: currentPlan === "PREMIUM",
    },
    {
      name: "🚀Enterprise",
      planType: "ENTERPRISE",
      description: "For agencies and businesses with multiple locations",
      price: {
        monthly: userCountry === "IN" ? 12999 : 150,
        annual: userCountry === "IN" ? 12999 * 0.8 : 150 * 0.8, // 20% discount for annual
        display: userCountry === "IN" ? "₹" : "$",
      },
      features: [
        { name: "GMB Listings", value: "100" },
        { name: "GMB Posts", value: "Unlimited" },
        { name: "Reports / Insights", value: true },
        { name: "Review Response Automation", value: true },
        { name: "GMB AI Assistant", value: "Advanced AI Insights" },
        { name: "Geo-Grid Rank Tracking", value: "10 Keywords" },
        { name: "White-label Reports", value: true },
        { name: "Team Access", value: true },
        {
          name: "Turbo Post (AI Auto Scheduler)",
          value: "30 / 60 / 90 Days AI Content + Auto Posting",
        },
        { name: "Support", value: "Priority + Account Manager + WhatsApp" },
        { name: "Free Trial", value: "7 Days" },
      ],
      cta: "Select Plan",
      isPopular: false,
      ctaColor: "bg-locaposty-primary",
      isRecommended: currentPlan === "ENTERPRISE",
    },
  ];

  // Handle plan selection
  const handleSelectPlan = async (planType: string) => {
    setIsLoading(planType);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType,
          billingCycle: isAnnual ? "ANNUAL" : "MONTHLY",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create subscription");
      }

      // On success, redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating subscription:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  // Function to render feature value
  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-500" />
      );
    }
    return <span>{value}</span>;
  };

  // Function to render price with currency
  const renderPrice = (price: number, display: string) => {
    return `${display}${price}`;
  };

  // Render button based on plan
  const renderActionButton = (plan: (typeof pricingPlans)[0]) => {
    return (
      <Button
        className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
        onClick={() => handleSelectPlan(plan.planType)}
        disabled={
          isLoading === plan.planType ||
          (pageType === "PLAN_UPGRADE" && plan.planType === currentPlan)
        }
      >
        {isLoading === plan.planType ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait...
          </>
        ) : pageType === "PLAN_UPGRADE" && plan.planType === currentPlan ? (
          "Current Plan"
        ) : (
          plan.cta
        )}
      </Button>
    );
  };

  // Render status message based on page type
  const renderStatusMessage = () => {
    switch (pageType) {
      case "TRIAL_EXPIRED":
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="font-medium text-amber-800">
                {daysExpired
                  ? `Your trial ended ${daysExpired} ${
                      daysExpired === 1 ? "day" : "days"
                    } ago.`
                  : "Your trial period has ended."}
              </h3>
            </div>
            <p className="mt-2 text-amber-700">
              Select a plan below to continue using all features of LocaPosty
              without interruption.
            </p>
          </div>
        );
      case "TRIAL_EXPIRING":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium text-blue-800">
                {daysUntilExpiration === 0
                  ? "Your trial expires today!"
                  : daysUntilExpiration === 1
                    ? "Your trial expires tomorrow!"
                    : `Your trial expires in ${daysUntilExpiration} days.`}
              </h3>
            </div>
            <p className="mt-2 text-blue-700">
              Select a plan now to ensure uninterrupted access to all features.
            </p>
          </div>
        );
      case "PLAN_UPGRADE":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium text-green-800">
                You&apos;re currently on the{" "}
                <span className="font-semibold">{currentPlan}</span> plan.
              </h3>
            </div>
            <p className="mt-2 text-green-700">
              Upgrade your plan to unlock additional features and capabilities.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-white py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            {pageType === "PLAN_UPGRADE"
              ? "Upgrade Your Plan"
              : pageType === "TRIAL_EXPIRING"
                ? "Your Trial Is Ending Soon"
                : "Your Trial Has Expired"}
          </h1>
          <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto mb-8">
            {pageType === "PLAN_UPGRADE"
              ? "Choose a higher tier plan to unlock more features and capabilities"
              : "Continue enjoying all the premium features by selecting a plan below"}
          </p>

          {renderStatusMessage()}

          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-10">
            <span
              className={`text-sm font-medium ${
                !isAnnual
                  ? "text-locaposty-text-dark"
                  : "text-locaposty-text-medium"
              }`}
            >
              Monthly
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <div className="flex items-center">
              <span
                className={`text-sm font-medium ${
                  isAnnual
                    ? "text-locaposty-text-dark"
                    : "text-locaposty-text-medium"
                }`}
              >
                Annual
              </span>
              <span className="ml-2 bg-locaposty-secondary/20 text-locaposty-secondary text-xs font-medium px-2 py-0.5 rounded">
                Save 20%
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md mb-6">
              {error}
            </div>
          )}
        </div>

        {/* Pricing Table View - Desktop */}
        <div className="hidden md:block overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-purple-50 border border-purple-100 p-4 text-left w-1/4">
                  Feature
                </th>
                {pricingPlans.map((plan, idx) => (
                  <th
                    key={idx}
                    className={`bg-purple-50 border border-purple-100 p-4 text-center w-1/4 ${
                      plan.isPopular ? "bg-purple-100" : ""
                    } ${plan.isRecommended ? "bg-amber-100" : ""}`}
                  >
                    {plan.name}
                    {plan.isPopular && (
                      <div className="mt-1 inline-block bg-locaposty-secondary text-white text-xs px-2 py-0.5 rounded-full">
                        Most Popular
                      </div>
                    )}
                    {plan.isRecommended && pageType !== "PLAN_UPGRADE" && (
                      <div className="mt-1 inline-block bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Recommended
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-4 bg-gray-50 font-medium">
                  Monthly Price
                </td>
                {pricingPlans.map((plan, idx) => (
                  <td
                    key={idx}
                    className={`border border-gray-200 p-4 text-center ${
                      plan.isPopular ? "bg-blue-50" : ""
                    } ${plan.isRecommended ? "bg-amber-50" : ""}`}
                  >
                    <div className="font-bold text-lg">
                      {renderPrice(
                        isAnnual
                          ? Math.round(plan.price.annual)
                          : plan.price.monthly,
                        plan.price.display
                      )}
                      /mo
                    </div>
                    {isAnnual && (
                      <div className="mt-1 text-xs text-green-600 font-medium">
                        Save 20% annually
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              {/* Features rows */}
              {pricingPlans[0].features.map((feature, featureIdx) => (
                <tr
                  key={featureIdx}
                  className={featureIdx % 2 === 0 ? "bg-gray-50" : ""}
                >
                  <td className="border border-gray-200 p-4 font-medium">
                    {feature.name}
                  </td>
                  {pricingPlans.map((plan, planIdx) => (
                    <td
                      key={planIdx}
                      className={`border border-gray-200 p-4 text-center ${
                        plan.isPopular ? "bg-blue-50" : ""
                      } ${plan.isRecommended ? "bg-amber-50" : ""}`}
                    >
                      <div className="flex justify-center">
                        {renderFeatureValue(plan.features[featureIdx].value)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="border border-gray-200 p-4"></td>
                {pricingPlans.map((plan, idx) => (
                  <td
                    key={idx}
                    className={`border border-gray-200 p-4 text-center ${
                      plan.isPopular ? "bg-blue-50" : ""
                    } ${plan.isRecommended ? "bg-amber-50" : ""}`}
                  >
                    {renderActionButton(plan)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Card view for mobile */}
        <div className="grid grid-cols-1 md:hidden gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 ${
                plan.isPopular
                  ? "border-2 border-locaposty-secondary shadow-lg"
                  : plan.isRecommended
                    ? "border-2 border-amber-400 shadow-lg"
                    : "border border-gray-200"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-locaposty-secondary text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {plan.isRecommended && pageType !== "PLAN_UPGRADE" && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-locaposty-text-dark mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-locaposty-text-medium">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-locaposty-text-dark">
                    {renderPrice(
                      isAnnual
                        ? Math.round(plan.price.annual)
                        : plan.price.monthly,
                      plan.price.display
                    )}
                  </span>
                  <span className="text-locaposty-text-medium">/month</span>
                </div>
                {isAnnual && (
                  <div className="mt-1 text-sm text-green-600 font-medium">
                    Save 20% with annual billing
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.slice(0, 5).map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className="flex items-start justify-between text-sm"
                  >
                    <span className="text-locaposty-text-medium">
                      {feature.name}
                    </span>
                    <div className="ml-2">
                      {renderFeatureValue(feature.value)}
                    </div>
                  </li>
                ))}
              </ul>

              {renderActionButton(plan)}
            </div>
          ))}
        </div>

        <div className="text-center mt-10 text-locaposty-text-medium">
          <p className="text-sm">
            All plans include full access to all features. Need help choosing?{" "}
            <a
              href="#"
              className="text-locaposty-primary font-medium hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
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
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
    </Suspense>
  );
}
