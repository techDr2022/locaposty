"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

// Form validation schema
const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// Extract the signup form into a separate component that uses useSearchParams
const SignupFormComponent = () => {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>("/dashboard");

  // Extract URL parameters
  useEffect(() => {
    const plan = searchParams.get("plan");
    const callback = searchParams.get("callbackUrl") || "/dashboard";

    if (plan) {
      setPlanType(plan);
    }

    setCallbackUrl(callback);
  }, [searchParams]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    setSignupError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          planType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      // Show success message
      setSignupSuccess(
        "Account created successfully! Please check your email to verify your account before logging in."
      );
      // Clear the form
      form.reset();
    } catch (error) {
      setSignupError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // If we have a plan type, we need to include it as state to be handled after OAuth
      if (planType) {
        // Note: Additional server-side logic would be needed to handle this after Google auth
        await signIn("google", {
          callbackUrl: `/api/auth/oauth-callback?signupPlan=${planType}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        });
      } else {
        await signIn("google", { callbackUrl });
      }
    } catch (error: unknown) {
      setSignupError("Failed to sign in with Google");
      console.error("Google sign-in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
        <CardDescription className="text-center">
          {planType
            ? `Fill in your details to start your free trial`
            : `Fill in your details to create an account`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {signupSuccess && (
          <div className="bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">
            {signupSuccess}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full mb-6"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <img src="/google.svg" alt="Google" className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-2 text-sm text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {signupError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
            {signupError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      type="email"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : planType ? (
                "Sign up & Verify Email"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <p className="text-sm text-center text-locaposty-text-medium">
          By signing up, you agree to our{" "}
          <Link
            href="/terms"
            className="text-locaposty-primary hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-locaposty-primary hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-locaposty-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

// Main page component with Suspense boundary
export default function SignupPage() {
  const searchParams = useSearchParams();
  const [planType, setPlanType] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const provider = searchParams.get("provider");

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan) {
      setPlanType(plan);
      setShowPlans(false);
    } else if (provider === "google") {
      // If provider is Google but no plan, still show the signup form
      setShowPlans(false);
    } else {
      // If no plan is specified and no provider, show pricing plans
      setShowPlans(true);
    }
  }, [searchParams, provider]);

  return (
    <div className="min-h-screen bg-locaposty-bg flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {showPlans ? (
          <>
            <div className="text-center mb-8 w-full">
              <h1 className="text-3xl font-bold text-locaposty-text-dark">
                Choose your{" "}
                <span className="text-locaposty-primary">LocaPosty</span> plan
              </h1>
              <p className="mt-2 text-locaposty-text-medium">
                Select a plan to start your free trial
              </p>
            </div>
            <div className="w-full">
              <PricingSection isSignup={true} />
            </div>
          </>
        ) : (
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-locaposty-text-dark">
                Create your{" "}
                <span className="text-locaposty-primary">LocaPosty</span>{" "}
                account
              </h1>
              <p className="mt-2 text-locaposty-text-medium">
                Join thousands of businesses managing their Google Business
                Profiles
              </p>
              {planType && (
                <p className="mt-2 text-locaposty-primary font-medium">
                  You&apos;re signing up for the {planType.toLowerCase()} plan
                  with a free trial
                </p>
              )}
            </div>

            <Suspense
              fallback={
                <div className="h-96 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-locaposty-primary" />
                </div>
              }
            >
              <SignupFormComponent />
            </Suspense>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
