import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract payment verification details
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      razorpay_subscription_id,
      userId,
    } = body;

    // Verify if required fields are present
    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !userId
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify payment signature from Razorpay
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update user subscription status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        razorpayPaymentId: razorpay_payment_id,
        currentPeriodStart: new Date(),
        // Set the end period to 30 days from now (adjust based on your subscription cycle)
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        subscriptionId: razorpay_subscription_id || user.subscriptionId,
        status: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);

    return NextResponse.json(
      { success: false, message: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
