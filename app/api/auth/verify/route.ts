import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * API route to verify a user's email address
 *
 * Expects a token query parameter in the URL that matches a user's
 * emailVerificationToken
 */
export async function GET(req: NextRequest) {
  try {
    // Get the token from the URL query parameters
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is missing" },
        { status: 400 }
      );
    }

    // Find the user with the matching verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Update the user to mark email as verified and clear the verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      },
    });

    // Redirect to the login page with success message
    return NextResponse.redirect(
      new URL(
        `/login?verified=true&email=${encodeURIComponent(user.email)}`,
        req.url
      )
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify email" },
      { status: 500 }
    );
  }
}
