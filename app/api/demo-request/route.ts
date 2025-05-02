import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Define the from email address
const fromEmail = process.env.FROM_EMAIL || "hi@locaposty.com";
// Define where demo requests should be sent
const demoRequestRecipient =
  process.env.DEMO_REQUEST_EMAIL || "hi@locaposty.com";

/**
 * Handles demo request submissions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, businessName, locations } = body;
    console.log("Body:", body);

    if (!email || !name || !businessName || !locations) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send demo request notification email
    const notificationResult = await transporter.sendMail({
      from: `LocaPosty <${fromEmail}>`,
      to: demoRequestRecipient,
      subject: "New Demo Request from LocaPosty",
      html: `
        <h1>New Demo Request</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Number of Locations:</strong> ${locations}</p>
      `,
    });

    // Also send confirmation email to the requester
    const confirmationResult = await transporter.sendMail({
      from: `LocaPosty <${fromEmail}>`,
      to: email,
      subject: "We've received your demo request - LocaPosty",
      html: `
        <h1>Thank you for your interest in LocaPosty!</h1>
        <p>Dear ${name},</p>
        <p>We've received your request for a demo of our platform. A member of our team will be in touch with you shortly to schedule your personalized demonstration.</p>
        <p>Here's a summary of the information you provided:</p>
        <ul>
          <li><strong>Business Name:</strong> ${businessName}</li>
          <li><strong>Number of Locations:</strong> ${locations}</li>
        </ul>
        <p>If you have any questions in the meantime, please don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The LocaPosty Team</p>
      `,
    });

    console.log("Notification result:", notificationResult);
    console.log("Confirmation result:", confirmationResult);

    if (!notificationResult.messageId || !confirmationResult.messageId) {
      console.error("Error sending email: No message ID returned");
      return NextResponse.json(
        { success: false, message: "Failed to process demo request" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Demo request submitted successfully",
        data: {
          notificationId: notificationResult.messageId,
          confirmationId: confirmationResult.messageId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Demo request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}
