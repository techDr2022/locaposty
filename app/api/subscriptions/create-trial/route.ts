import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, User } from "@/lib/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSubscriptionWithTrial, PLANS } from "@/lib/razorpay";
import { SubscriptionPlan, SubscriptionStatus } from "@/lib/generated/prisma";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// Helper function to find a user with retry
const findUserWithRetry = async (
  userId: string,
  maxRetries = 3
): Promise<User | null> => {
  let retries = 0;
  let user = null;

  while (retries < maxRetries && !user) {
    user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) return user;

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));
    retries++;
  }

  return user;
};

export async function POST(req: NextRequest) {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(
      `Creating trial for user: ${session.user.id}, email: ${session.user.email}`
    );

    // Parse request body
    const body = await req.json();
    const { planType } = body;

    // Validate plan type
    if (!planType || !["BASIC", "PREMIUM", "ENTERPRISE"].includes(planType)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan type" },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = PLANS[planType as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }

    // Get user details with retry mechanism
    const user = await findUserWithRetry(session.user.id);

    if (!user) {
      console.error(
        `User not found after retries. Session user ID: ${session.user.id}`
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "User record not found. Please try again in a few moments or contact support.",
        },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    if (
      user.subscriptionStatus === "ACTIVE" ||
      user.subscriptionStatus === "TRIALING"
    ) {
      return NextResponse.json(
        { success: false, message: "User already has an active subscription" },
        { status: 400 }
      );
    }

    // Default to India for country if not specified
    const country = "IN";

    // Create subscription with trial period in Razorpay
    const subscription = await createSubscriptionWithTrial(
      user.id,
      user.email,
      user.name,
      planType,
      plan.trialDays,
      country
    );

    // Calculate trial end date
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(subscription.trialEndDate);

    // Update user with subscription details
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionId: subscription.subscriptionId,
          subscriptionStatus: SubscriptionStatus.TRIALING,
          subscriptionPlan: planType as SubscriptionPlan,
          trialStartedAt,
          trialEndsAt,
          razorpayCustomerId: subscription.customerId,
          razorpayOrderId: subscription.orderId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Trial subscription created successfully",
        data: {
          subscriptionId: updatedUser.subscriptionId,
          status: updatedUser.subscriptionStatus,
          plan: updatedUser.subscriptionPlan,
          trialEndsAt: updatedUser.trialEndsAt,
          orderId: subscription.orderId,
        },
      });
    } catch (updateError) {
      console.error(
        "Error updating user with subscription details:",
        updateError
      );
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update user with subscription details",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating trial subscription:", error);

    // Return a more descriptive error message if available
    const errorMessage =
      error instanceof Error
        ? `Failed to create trial subscription: ${error.message}`
        : "Failed to create trial subscription";

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
