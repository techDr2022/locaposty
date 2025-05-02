import { PrismaClient } from "@/lib/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { generateVerificationToken } from "@/lib/utils";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

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

    // Validate input
    const validationResult = signupSchema.safeParse(body);

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

    // Send verification email
    const emailResponse = await fetch(`${req.nextUrl.origin}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        verificationToken: emailVerificationToken,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Failed to send verification email");
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      password: _pwd,
      emailVerificationToken: _token,
      ...userWithoutPassword
    } = user;

    return NextResponse.json(
      {
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: userWithoutPassword,
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
