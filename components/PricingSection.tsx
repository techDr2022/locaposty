"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// Define a type for the window with Razorpay
declare global {
  interface Window {
    Razorpay: {
      new (options: Record<string, unknown>): {
        open: () => void;
      };
    };
  }
}

// Function to fetch user's location based on IP
const fetchUserLocation = async () => {
  try {
    // First, try with ipapi.co with browser-like headers
    const response = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000), // Increase timeout slightly
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://locaposty.vercel.app/",
        Origin: "https://locaposty.vercel.app",
      },
      credentials: "same-origin",
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.country;
  } catch (error) {
    console.error("Error fetching user location from ipapi.co:", error);

    // Fallback to alternative API
    try {
      const fallbackResponse = await fetch(
        "https://api.ipgeolocation.io/ipgeo?apiKey=e02ad1d79102428e914c18d4952b546a",
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            Referer: "https://locaposty.vercel.app/",
          },
          method: "GET",
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!fallbackResponse.ok) {
        throw new Error(
          `Fallback API responded with status: ${fallbackResponse.status}`
        );
      }

      const fallbackData = await fallbackResponse.json();
      return fallbackData.country_code2;
    } catch (fallbackError) {
      console.error(
        "Error fetching from fallback location API:",
        fallbackError
      );

      // Try a third option - CloudFlare-based service
      try {
        const cfResponse = await fetch(
          "https://www.cloudflare.com/cdn-cgi/trace"
        );
        if (cfResponse.ok) {
          const text = await cfResponse.text();
          const locMatch = text.match(/loc=([A-Z]{2})/);
          if (locMatch && locMatch[1]) {
            return locMatch[1];
          }
        }
        throw new Error("Could not parse country from CloudFlare trace");
      } catch (cfError) {
        console.error("Error with CloudFlare location detection:", cfError);
        // Provide a default value if all APIs fail
        return "IN"; // Default to IN if we can't determine location
      }
    }
  }
};

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<{
    subscriptionId?: string;
    status?: string;
    plan?: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    orderId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);

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

  // Fetch user location on component mount with caching
  useEffect(() => {
    const getUserCountry = async () => {
      try {
        // Check if we have a cached country in localStorage
        const cachedCountry = localStorage.getItem("user_country");
        const cacheTimestamp = localStorage.getItem("user_country_timestamp");

        // Use cache if it exists and is less than 24 hours old
        if (cachedCountry && cacheTimestamp) {
          const cacheTime = parseInt(cacheTimestamp);
          const now = Date.now();
          // Cache valid for 24 hours (86400000 ms)
          if (now - cacheTime < 86400000) {
            console.log("Using cached country:", cachedCountry);
            setUserCountry(cachedCountry);
            return;
          }
        }

        // If no valid cache, fetch from API
        const country = await fetchUserLocation();
        setUserCountry(country);

        // Cache the result
        localStorage.setItem("user_country", country);
        localStorage.setItem("user_country_timestamp", Date.now().toString());
      } catch (error) {
        console.error("Could not fetch user location:", error);
        setUserCountry("IN"); // Default fallback
      }
    };
    getUserCountry();
  }, []);

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
      cta: "Start Free Trial",
      isPopular: false,
      ctaColor: "bg-locaposty-primary",
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
      cta: "Start Free Trial",
      isPopular: true,
      ctaColor: "bg-locaposty-secondary",
    },
    {
      name: "🚀 Pro",
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
      cta: "Start Free Trial",
      isPopular: false,
      ctaColor: "bg-locaposty-primary",
    },
  ];

  // Start free trial function
  const startFreeTrial = async (planType: string) => {
    if (!session?.user) {
      // Redirect to signup page with plan info in URL parameters
      router.push(`/signup?plan=${planType}&callbackUrl=/dashboard`);
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
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  // Define Razorpay response interface
  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  // Handle payment after trial
  const handlePayment = (plan: {
    name: string;
    planType: string;
    description?: string;
    price: {
      monthly: number;
      annual: number;
      display: string;
    };
    features?: Array<{ name: string; value: string | boolean }>;
    cta?: string;
    isPopular?: boolean;
    ctaColor?: string;
  }) => {
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
      order_id: userSubscription?.orderId,
      name: "LocaPosty",
      description: `${plan.name} Plan Subscription`,
      handler: async function (response: RazorpayResponse) {
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
        } catch (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _
        ) {
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
    const razorpay = new window.Razorpay(options);
    razorpay.open();
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

  // Render button based on subscription status
  const renderActionButton = (plan: (typeof pricingPlans)[0]) => {
    // If no user is logged in
    if (!session?.user) {
      return (
        <Button
          className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
          onClick={() => startFreeTrial(plan.planType)}
          disabled={isLoading === plan.planType}
        >
          {isLoading === plan.planType ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : (
            plan.cta
          )}
        </Button>
      );
    }

    // If user has a subscription
    if (userSubscription) {
      // If subscription is inactive, treat like no subscription
      if (userSubscription.status === "INACTIVE" || !userSubscription.status) {
        return (
          <Button
            className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
            onClick={() => startFreeTrial(plan.planType)}
            disabled={isLoading === plan.planType}
          >
            {isLoading === plan.planType ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              plan.cta
            )}
          </Button>
        );
      }

      // If on free trial for this plan
      if (
        userSubscription.status === "TRIALING" &&
        userSubscription.plan === plan.planType
      ) {
        return (
          <Button
            className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
            onClick={() => handlePayment(plan)}
            disabled={isLoading === plan.planType}
          >
            {isLoading === plan.planType ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        );
      }

      // If active subscription for this plan
      if (
        userSubscription.status === "ACTIVE" &&
        userSubscription.plan === plan.planType
      ) {
        return (
          <Button
            className="w-full bg-green-600 text-white hover:opacity-90"
            variant="outline"
            disabled
          >
            Current Plan
          </Button>
        );
      }

      // If has another active or trialing plan
      if (
        userSubscription.status === "ACTIVE" ||
        userSubscription.status === "TRIALING"
      ) {
        return (
          <Button
            className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
            variant="outline"
            disabled={isLoading === plan.planType}
            onClick={() => handlePayment(plan)}
          >
            {isLoading === plan.planType ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Switch Plan"
            )}
          </Button>
        );
      }

      // For any other subscription status (PAST_DUE, CANCELED, EXPIRED)
      return (
        <Button
          className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
          onClick={() => startFreeTrial(plan.planType)}
          disabled={isLoading === plan.planType}
        >
          {isLoading === plan.planType ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : (
            plan.cta
          )}
        </Button>
      );
    }

    // Default - no subscription yet
    return (
      <Button
        className={`w-full ${plan.ctaColor} text-white hover:opacity-90`}
        onClick={() => startFreeTrial(plan.planType)}
        disabled={isLoading === plan.planType}
      >
        {isLoading === plan.planType ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait...
          </>
        ) : (
          plan.cta
        )}
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

      <section id="pricing" className="bg-white py-20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
              Simple, Transparent{" "}
              <span className="text-locaposty-primary">Pricing</span>
            </h2>
            <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto mb-8">
              Choose the plan that works best for your business needs.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
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
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Pricing Table View */}
          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
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
                      }`}
                    >
                      {plan.name}
                      {plan.isPopular && (
                        <div className="mt-1 inline-block bg-locaposty-secondary text-white text-xs px-2 py-0.5 rounded-full">
                          Most Popular
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
                      }`}
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
                        }`}
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
                      }`}
                    >
                      {renderActionButton(plan)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Card view for mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 md:hidden">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  plan.isPopular
                    ? "border-2 border-locaposty-secondary shadow-lg"
                    : "border border-gray-200"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-locaposty-secondary text-white text-sm font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-locaposty-text-dark mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-locaposty-text-medium">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-locaposty-text-dark">
                      {renderPrice(
                        isAnnual
                          ? Math.round(plan.price.annual)
                          : plan.price.monthly,
                        plan.price.display
                      )}
                    </span>
                    <span className="text-locaposty-text-medium">/month</span>
                  </div>
                  <div className="text-sm text-locaposty-text-medium mt-1">
                    {renderPrice(
                      isAnnual
                        ? Math.round(plan.price.annual)
                        : plan.price.monthly,
                      plan.price.display
                    )}
                    /month
                  </div>
                  {isAnnual && (
                    <div className="mt-1 text-sm text-green-600 font-medium">
                      Save 20% with annual billing
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-start justify-between"
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

          <div className="text-center mt-12 text-locaposty-text-medium">
            <p>
              All plans include a 14-day free trial. No credit card required.
            </p>
            <p className="mt-2">
              Need a custom plan for multiple locations?{" "}
              <a
                href="#"
                className="text-locaposty-primary font-medium hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingSection;
