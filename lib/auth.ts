import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { SubscriptionPlan, SubscriptionStatus } from "@/lib/generated/prisma";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { DefaultSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        // Verify email if required
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback called");
      if (user) {
        token.id = user.id;

        // Fetch subscription data when generating JWT
        try {
          const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              subscriptionPlan: true,
              subscriptionStatus: true,
              trialEndsAt: true,
            },
          });

          if (userData) {
            token.subscriptionPlan = userData.subscriptionPlan;
            token.subscriptionStatus = userData.subscriptionStatus;
            token.trialEndsAt = userData.trialEndsAt;
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
        }
      }

      // Check trial expiry on each JWT refresh (happens frequently)
      if (token.subscriptionStatus === "TRIALING" && token.trialEndsAt) {
        const trialEndsAt = new Date(token.trialEndsAt);
        const now = new Date();

        if (now > trialEndsAt) {
          // Trial has expired, update user status in database
          try {
            await prisma.user.update({
              where: { id: token.id as string },
              data: {
                subscriptionStatus: SubscriptionStatus.PAST_DUE,
              },
            });

            // Update token with new status
            token.subscriptionStatus = SubscriptionStatus.PAST_DUE;
          } catch (error) {
            console.error(
              "Error updating trial status in JWT callback:",
              error
            );
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log("Session callback called");
      if (token && session.user) {
        session.user.id = token.id as string;

        // Always refresh subscription data on session creation
        try {
          const userData = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              subscriptionPlan: true,
              subscriptionStatus: true,
              trialEndsAt: true,
            },
          });

          if (userData) {
            // Add subscription data to the session
            session.user.subscriptionPlan = userData.subscriptionPlan as
              | SubscriptionPlan
              | undefined;
            session.user.subscriptionStatus = userData.subscriptionStatus as
              | SubscriptionStatus
              | undefined;
            session.user.trialEndsAt = userData.trialEndsAt;
          } else {
            // Fallback to token data if user not found
            session.user.subscriptionPlan = token.subscriptionPlan as
              | SubscriptionPlan
              | undefined;
            session.user.subscriptionStatus = token.subscriptionStatus as
              | SubscriptionStatus
              | undefined;
            session.user.trialEndsAt = token.trialEndsAt as Date | null;
          }
        } catch (error) {
          console.error(
            "Error refreshing subscription data in session callback:",
            error
          );

          // Fallback to token data on error
          session.user.subscriptionPlan = token.subscriptionPlan as
            | SubscriptionPlan
            | undefined;
          session.user.subscriptionStatus = token.subscriptionStatus as
            | SubscriptionStatus
            | undefined;
          session.user.trialEndsAt = token.trialEndsAt as Date | null;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Augment the next-auth session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionPlan?: SubscriptionPlan;
      subscriptionStatus?: SubscriptionStatus;
      trialEndsAt?: Date | null;
    } & DefaultSession["user"];
  }
}

// Augment the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    subscriptionPlan?: SubscriptionPlan | null;
    subscriptionStatus?: SubscriptionStatus | null;
    trialEndsAt?: Date | null;
  }
}
