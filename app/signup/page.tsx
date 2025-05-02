"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
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

  // Start trial after signup
  const startTrialWithPlan = async (email: string, password: string) => {
    if (!planType) return;

    setStartingTrial(true);

    try {
      // Add a slight delay to ensure user record is fully created
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // First sign in with the newly created account
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Add another slight delay to ensure the session is established
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then create the trial subscription
      const trialResponse = await fetch("/api/subscriptions/create-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      });

      const trialResult = await trialResponse.json();

      if (!trialResponse.ok) {
        throw new Error(trialResult.message || "Failed to start trial");
      }

      // Redirect to dashboard or callbackUrl
      router.push(callbackUrl);
    } catch (error) {
      setSignupError(
        error instanceof Error
          ? `Account created, but couldn't start trial: ${error.message}`
          : "Account created, but couldn't start trial"
      );
    } finally {
      setStartingTrial(false);
    }
  };

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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      // If we have a plan parameter, start trial automatically
      if (planType) {
        await startTrialWithPlan(data.email, data.password);
      } else {
        // Show regular success message if no plan
        setSignupSuccess(
          "Account created successfully! Please check your email to verify your account before logging in."
        );
        // Clear the form
        form.reset();
      }
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
          callbackUrl: `/api/auth/oauth-callback?plan=${planType}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
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
    <div className="min-h-screen bg-locaposty-bg flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-locaposty-text-dark">
              Create your{" "}
              <span className="text-locaposty-primary">LocaPosty</span> account
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
                disabled={isLoading || startingTrial}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <img
                    src="/google.svg"
                    alt="Google"
                    className="mr-2 h-4 w-4"
                  />
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
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || startingTrial}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : startingTrial ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting your trial...
                      </>
                    ) : planType ? (
                      "Sign up & Start Free Trial"
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
