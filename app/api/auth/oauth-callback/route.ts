import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
} from "@/lib/generated/prisma";
import { PLANS } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

// Helper function to find a user with retry
const findUserWithRetry = async (
  userId: string,
  maxRetries = 5
): Promise<User | null> => {
  let retries = 0;
  let user = null;

  while (retries < maxRetries && !user) {
    user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      console.log(`Found user on attempt ${retries + 1}: ${user.id}`);
      return user;
    }

    console.log(
      `User ${userId} not found on attempt ${retries + 1}, retrying...`
    );

    // Increase wait time between retries (exponential backoff)
    const waitTime = Math.min(2000 * Math.pow(2, retries), 10000);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    retries++;
  }

  return user;
};

// Create trial subscription directly (no server-to-server HTTP request)
const createTrialDirectly = async (
  userId: string,
  email: string | null | undefined,
  name: string | null | undefined,
  planType: string
): Promise<boolean> => {
  try {
    console.log(
      `Creating trial directly for user: ${userId}, plan: ${planType}`
    );

    // Get plan details
    const plan = PLANS[planType as keyof typeof PLANS];
    if (!plan) {
      console.error(`Plan not found: ${planType}`);
      return false;
    }

    // Get user details with retry mechanism
    const user = await findUserWithRetry(userId);

    if (!user) {
      console.error(
        `User not found after retries. Session user ID: ${userId}, email: ${email}`
      );

      // Special handling for OAuth users who might have different ID format
      // Try to find user by email as a fallback
      if (email) {
        const userByEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (userByEmail) {
          console.log(
            `Found user by email: ${userByEmail.id} instead of session ID: ${userId}`
          );

          // Check subscription status for this user
          if (
            userByEmail.subscriptionStatus === "ACTIVE" ||
            userByEmail.subscriptionStatus === "TRIALING"
          ) {
            console.log(
              `User ${userByEmail.id} already has an active subscription: ${userByEmail.subscriptionStatus}`
            );
            return true; // Consider this a success since user already has subscription
          }

          // Calculate trial end date
          const trialStartedAt = new Date(new Date().toISOString());
          const trialEndsAt = new Date(trialStartedAt);
          trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 7);

          // Update user with subscription details
          await prisma.user.update({
            where: { id: userByEmail.id },
            data: {
              subscriptionStatus: SubscriptionStatus.TRIALING,
              subscriptionPlan: planType as SubscriptionPlan,
              trialStartedAt,
              trialEndsAt,
            },
          });

          console.log(
            `Successfully created trial for user ${userByEmail.id} found by email`
          );
          return true;
        }
      }

      console.error("Couldn't find user by ID or email");
      return false;
    }

    // Check if user already has an active subscription
    if (
      user.subscriptionStatus === "ACTIVE" ||
      user.subscriptionStatus === "TRIALING"
    ) {
      console.log(
        `User ${user.id} already has an active subscription: ${user.subscriptionStatus}`
      );
      return true; // Consider this a success since user already has subscription
    }

    // Calculate trial end date
    const trialStartedAt = new Date(new Date().toISOString());
    const trialEndsAt = new Date(trialStartedAt);
    trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 7);

    // Update user with subscription details
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        subscriptionPlan: planType as SubscriptionPlan,
        trialStartedAt,
        trialEndsAt,
      },
    });

    console.log(`Successfully created trial for user ${user.id}`);
    return true;
  } catch (error) {
    console.error("Error creating trial subscription directly:", error);
    return false;
  }
};

export async function GET(req: NextRequest) {
  try {
    // Get the URL parameters
    const url = new URL(req.url);
    const planType = url.searchParams.get("plan");
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";
    const signupPlan = url.searchParams.get("signupPlan");

    // If signupPlan is specified, it means this is coming from signup via OAuth
    // Just preserve the plan parameter when redirecting to ensure it's handled post-auth
    if (signupPlan) {
      console.log(`Preserving signup plan for OAuth: ${signupPlan}`);
      const redirectUrl = new URL(callbackUrl, req.url);
      redirectUrl.searchParams.set("plan", signupPlan);
      return NextResponse.redirect(redirectUrl);
    }

    // If no plan specified, just redirect
    if (!planType) {
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log("No session found for OAuth callback, redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    console.log(
      `OAuth callback for user: ${session.user.id}, plan: ${planType}`
    );

    // Try to create trial directly instead of making a server-to-server request
    const success = await createTrialDirectly(
      session.user.id,
      session.user.email,
      session.user.name,
      planType
    );

    if (success) {
      // On success, redirect to the dashboard or original callback URL with success parameter
      const successUrl = new URL(callbackUrl, req.url);
      successUrl.searchParams.set("trialStarted", "true");
      successUrl.searchParams.set("plan", planType);
      return NextResponse.redirect(successUrl);
    } else {
      // If trial creation fails, redirect with error
      const errorUrl = new URL(callbackUrl, req.url);
      errorUrl.searchParams.set("error", "Failed to start trial");
      return NextResponse.redirect(errorUrl);
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=trial_setup_failed", req.url)
    );
  }
}
