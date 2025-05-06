import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { generateVerificationToken } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

// Validation schema
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract planType separately as it's not part of the validation schema
    const { planType, ...userData } = body;

    // Validate input
    const validationResult = signupSchema.safeParse(userData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, password: passwordFromInput } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already in use" },
        { status: 409 }
      );
    }

    // Generate verification token
    const emailVerificationToken = generateVerificationToken();

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordFromInput, 10);

    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerificationToken,
      },
    });

    const userId = user.id;

    // Send verification email with optional planType
    const emailResponse = await fetch(`${req.nextUrl.origin}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        verificationToken: emailVerificationToken,
        planType,
      }),
    });

    if (!emailResponse.ok) {
      await prisma.user.delete({
        where: { id: userId },
      });
      console.error("Failed to send verification email");
    }

    // Remove sensitive data from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      password: _,
      emailVerificationToken: _token,
      ...userWithoutSensitiveData
    } = user;

    return NextResponse.json(
      {
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: userWithoutSensitiveData,
        emailSent: emailResponse.ok,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
