import NextAuth from "next-auth/next";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { SubscriptionPlan, SubscriptionStatus } from "@/lib/generated/prisma";

// Define a more complete user type for session
type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

// Define JWT token type for type safety
type JWTToken = {
  id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

// Add a log for the database URL to check its format
console.log(
  "DATABASE_URL format:",
  process.env.DATABASE_URL?.substring(0, 20) + "..."
);

console.log("PrismaClient initialized successfully");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log(
          "Authorize function called with email:",
          credentials?.email
        );

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("User lookup result:", user ? "Found" : "Not found");

          if (!user || !user.password) {
            console.log("User not found or missing password");
            throw new Error("Error: UseOtherProvider");
          }

          if (!user.emailVerified) {
            console.log("Email not verified for user:", credentials.email);
            throw new Error("Error: EmailNotVerified");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("Password validation result:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("Invalid password");
            throw new Error("Error: InvalidPassword or Email");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image || undefined,
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn(params) {
      console.log("SignIn callback called");
      const { account, profile } = params;
      console.log("Account provider:", account?.provider);
      console.log("Profile email:", profile?.email);

      if (account?.provider === "google" && profile?.email) {
        try {
          console.log("Looking up Google user with email:", profile.email);
          const dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          console.log(
            "Google user lookup result:",
            dbUser ? "Found" : "Not found"
          );

          if (!dbUser) {
            console.log("User not found in database, redirecting to signup");
            return "/login?error=UserNotFound&provider=google";
          }

          return true;
        } catch (error) {
          console.error("Error in Google sign-in process:", error);
          return false;
        }
      }
      return true;
    },
    async jwt(params) {
      console.log("JWT callback called");
      const { token, user, account } = params;
      const jwtToken = token as JWTToken;

      if (account && user) {
        console.log("JWT: User from callback:", user.email);

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email || "" },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              subscriptionStatus: true,
              subscriptionPlan: true,
              trialStartedAt: true,
              trialEndsAt: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
            },
          });

          console.log(
            "JWT: Database user lookup result:",
            dbUser ? "Found" : "Not found"
          );

          if (dbUser) {
            console.log("JWT: Setting token ID to:", dbUser.id);
            // Update the token with user data including subscription info
            jwtToken.id = dbUser.id;
            jwtToken.name = dbUser.name;
            jwtToken.email = dbUser.email;
            jwtToken.picture = dbUser.image;
            jwtToken.sub = dbUser.id;
            jwtToken.subscriptionStatus =
              dbUser.subscriptionStatus || undefined;
            jwtToken.subscriptionPlan = dbUser.subscriptionPlan || undefined;
            jwtToken.trialStartedAt = dbUser.trialStartedAt;
            jwtToken.trialEndsAt = dbUser.trialEndsAt;
            jwtToken.currentPeriodStart = dbUser.currentPeriodStart;
            jwtToken.currentPeriodEnd = dbUser.currentPeriodEnd;
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
        }

        // Check for trial expiration and update if necessary
        if (
          jwtToken.subscriptionStatus === "TRIALING" &&
          jwtToken.trialEndsAt
        ) {
          try {
            const trialEnd = new Date(jwtToken.trialEndsAt);
            const now = new Date();

            if (now > trialEnd) {
              console.log("JWT: Trial has expired, updating status");

              // Update user subscription status in database
              await prisma.user.update({
                where: { id: jwtToken.id },
                data: { subscriptionStatus: "PAST_DUE" },
              });

              // Update token with new status
              jwtToken.subscriptionStatus = "PAST_DUE";
            }
          } catch (error) {
            console.error("Error checking trial expiration:", error);
          }
        }
      }
      return jwtToken;
    },
    async session(params) {
      console.log("Session callback called");
      const { session, token } = params;
      const jwtToken = token as JWTToken;
      console.log("Session token ID:", jwtToken.id);

      if (session.user && jwtToken.id) {
        console.log("Setting session user ID to:", jwtToken.id);
        session.user.id = jwtToken.id as string;

        // Fetch and include subscription details in the session
        try {
          console.log("Fetching subscription details for user:", jwtToken.id);
          const user = await prisma.user.findUnique({
            where: { id: jwtToken.id as string },
            select: {
              subscriptionStatus: true,
              subscriptionPlan: true,
              trialStartedAt: true,
              trialEndsAt: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
            },
          });

          if (user) {
            console.log("Found subscription data:", {
              status: user.subscriptionStatus,
              plan: user.subscriptionPlan,
              trialEndsAt: user.trialEndsAt,
            });

            // Add subscription data to the session using type assertion
            const sessionUser = session.user as SessionUser;
            sessionUser.subscriptionStatus =
              user.subscriptionStatus || undefined;
            sessionUser.subscriptionPlan = user.subscriptionPlan || undefined;
            sessionUser.trialStartedAt = user.trialStartedAt;
            sessionUser.trialEndsAt = user.trialEndsAt;
            sessionUser.currentPeriodStart = user.currentPeriodStart;
            sessionUser.currentPeriodEnd = user.currentPeriodEnd;
          } else {
            console.log("No user found for ID:", jwtToken.id);

            // Use token data as fallback
            console.log("Using token data as fallback for session");
            const sessionUser = session.user as SessionUser;
            sessionUser.subscriptionStatus = jwtToken.subscriptionStatus;
            sessionUser.subscriptionPlan = jwtToken.subscriptionPlan;
            sessionUser.trialStartedAt = jwtToken.trialStartedAt;
            sessionUser.trialEndsAt = jwtToken.trialEndsAt;
            sessionUser.currentPeriodStart = jwtToken.currentPeriodStart;
            sessionUser.currentPeriodEnd = jwtToken.currentPeriodEnd;
          }
        } catch (error) {
          console.error("Error fetching subscription details:", error);

          // Use token data as fallback on error
          console.log("Using token data as fallback for session due to error");
          const sessionUser = session.user as SessionUser;
          sessionUser.subscriptionStatus = jwtToken.subscriptionStatus;
          sessionUser.subscriptionPlan = jwtToken.subscriptionPlan;
          sessionUser.trialStartedAt = jwtToken.trialStartedAt;
          sessionUser.trialEndsAt = jwtToken.trialEndsAt;
          sessionUser.currentPeriodStart = jwtToken.currentPeriodStart;
          sessionUser.currentPeriodEnd = jwtToken.currentPeriodEnd;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/dashboard",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
