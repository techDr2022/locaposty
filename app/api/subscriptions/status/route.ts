import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubscriptionDetails } from "@/lib/razorpay";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

export async function GET() {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user with subscription details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialStartedAt: true,
        trialEndsAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        razorpayCustomerId: true,
        razorpayPaymentId: true,
        razorpayOrderId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If user has no subscription
    if (!user.subscriptionId) {
      return NextResponse.json({
        success: true,
        data: {
          status: "INACTIVE",
          plan: null,
          trialEndsAt: null,
          currentPeriodEnd: null,
        },
      });
    }

    // Update subscription status if trial has ended but status hasn't been updated
    if (
      user.subscriptionStatus === "TRIALING" &&
      user.trialEndsAt &&
      new Date(user.trialEndsAt) < new Date()
    ) {
      try {
        // Check with Razorpay for the current status
        const subscription = await getSubscriptionDetails(user.subscriptionId);

        // Update user subscription status
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            subscriptionStatus:
              subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
          },
        });

        // If active, update the data we'll return
        if (subscription.status === "active") {
          user.subscriptionStatus = "ACTIVE";
        } else {
          user.subscriptionStatus = "PAST_DUE";
        }
      } catch (error) {
        console.error("Error updating subscription status:", error);
        // Continue with existing data if there's an error
      }
    }

    // Return success response with orderId included
    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: user.subscriptionId,
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        trialEndsAt: user.trialEndsAt,
        currentPeriodEnd: user.currentPeriodEnd,
        orderId: user.razorpayOrderId,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
