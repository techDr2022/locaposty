import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import VerificationEmail from "@/emails/verification-email";

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

// Define the from email address (should be verified in Resend)
const fromEmail = "onboarding@resend.dev";

/**
 * Sends a verification email to a user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, verificationToken, planType } = body;

    if (!email || !name || !verificationToken) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send verification email using Resend
    const { data, error } = await resend.emails.send({
      from: `LocaPosty <${fromEmail}>`,
      to: [email],
      subject: "Verify your email address for LocaPosty",
      react: VerificationEmail({
        username: name,
        verificationToken,
        planType,
      }),
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { success: false, message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent successfully",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while sending the email" },
      { status: 500 }
    );
  }
}
