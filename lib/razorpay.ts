import Razorpay from "razorpay";
import crypto from "crypto";

// Define custom types to handle Razorpay API type mismatches
interface RazorpaySubscriptionParams {
  plan_id: string;
  customer_id?: string; // Make this optional
  customer_notify?: 0 | 1 | boolean; // Fix the type to match Razorpay's expectations
  total_count: number;
  start_at: number;
  addons: Array<Record<string, unknown>>; // Replace any with more specific type
  notes: Record<string, string>;
}

// Initialize Razorpay with credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plans configuration - these should match your Razorpay dashboard configured plans
export const PLANS = {
  FREE: { id: "free", name: "Free", price: 0, trialDays: 7 },
  BASIC: {
    id: "basic",
    name: "Basic",
    price: 2999,
    trialDays: 7,
    planId: "plan_basic",
    interval: "monthly",
  },
  PREMIUM: {
    id: "Standard",
    name: "Standard",
    price: 5999,
    trialDays: 14,
    planId: "plan_premium",
    interval: "monthly",
  },
  ENTERPRISE: {
    id: "Pro",
    name: "Pro",
    price: 12999,
    trialDays: 14,
    planId: "plan_enterprise",
    interval: "monthly",
  },
};

// Ensure the currency is set dynamically based on the user's location
const getCurrency = (country: string) => {
  return country === "IN" ? "INR" : "USD";
};

// Create a plan in Razorpay if it doesn't exist
export const createPlanIfNeeded = async (
  planType: "BASIC" | "PREMIUM" | "ENTERPRISE",
  country: string
) => {
  try {
    const plan = PLANS[planType];

    try {
      // Try to fetch the plan to see if it exists
      await razorpay.plans.fetch(plan.planId);
      return plan.planId; // Plan exists, return its ID
    } catch {
      // Plan doesn't exist, create it
      console.log(`Creating plan for ${planType}`);

      const newPlan = await razorpay.plans.create({
        period: plan.interval as "monthly" | "daily" | "weekly" | "yearly",
        interval: 1,
        item: {
          name: plan.name,
          amount: plan.price * 100, // Amount in paise (100 paise = 1 INR)
          currency: getCurrency(country),
          description: `${plan.name} Plan Subscription`,
        },
        notes: {
          note_key: planType,
        },
      });

      console.log(`Created plan with ID: ${newPlan.id}`);
      return newPlan.id;
    }
  } catch (error) {
    console.error("Error creating/fetching Razorpay plan:", error);
    throw error;
  }
};

// Create a subscription with trial period
export const createSubscriptionWithTrial = async (
  userId: string,
  email: string,
  name: string,
  planType: string,
  trialDays: number,
  country: string
) => {
  try {
    let customerId;
    // First try to find if customer exists
    try {
      const customers = await razorpay.customers.all();
      const existingCustomer = customers.items.find(
        (customer) => customer.email === email
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log(`Using existing customer with ID: ${customerId}`);
      } else {
        // Create a customer in Razorpay
        const customer = await razorpay.customers.create({
          name,
          email,
          contact: "",
          notes: {
            userId,
          },
        });
        customerId = customer.id;
        console.log(`Created customer with ID: ${customerId}`);
      }
    } catch (error) {
      console.error("Error finding/creating customer:", error);
      // Create a new customer as fallback
      const customer = await razorpay.customers.create({
        name,
        email,
        contact: "",
        notes: {
          userId,
        },
      });
      customerId = customer.id;
      console.log(`Created customer with ID: ${customerId}`);
    }

    // Get or create plan
    const planId = await createPlanIfNeeded(
      planType as "BASIC" | "PREMIUM" | "ENTERPRISE",
      country
    );

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Create a simple order first if needed
    const order = await razorpay.orders.create({
      amount: PLANS[planType as keyof typeof PLANS].price * 100, // Convert to paise
      currency: getCurrency(country),
      notes: {
        userId,
        description: `${PLANS[planType as keyof typeof PLANS].name} Plan Subscription`,
      },
    });

    console.log(`Created order with ID: ${order.id}`);

    // Create subscription with trial period
    // Use the custom type to work around TypeScript issues
    const subscriptionParams: RazorpaySubscriptionParams = {
      plan_id: planId,
      total_count: 12, // Billing cycles
      start_at: Math.floor(trialEndDate.getTime() / 1000), // Start billing after trial ends
      addons: [],
      notes: {
        userId,
        orderId: order.id,
      },
    };

    // Only add customer_id if it exists
    if (customerId) {
      subscriptionParams.customer_id = customerId;
    }

    // Type casting is necessary due to incompatible Razorpay SDK typings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = await razorpay.subscriptions.create(
      subscriptionParams as any
    );

    console.log(`Created subscription with ID: ${subscription.id}`);

    return {
      customerId,
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEndDate,
      orderId: order.id,
    };
  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    throw error;
  }
};

// Generate payment signature to verify Razorpay callback
export const generateSignature = (
  orderId: string,
  paymentId: string,
  secret = process.env.RAZORPAY_KEY_SECRET!
) => {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
};

// Verify payment signature from Razorpay
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string,
  secret = process.env.RAZORPAY_KEY_SECRET!
) => {
  const expectedSignature = generateSignature(orderId, paymentId, secret);
  return expectedSignature === signature;
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await razorpay.subscriptions.cancel(subscriptionId);
    return response;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
};

// Fetch subscription details
export const getSubscriptionDetails = async (subscriptionId: string) => {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
};
