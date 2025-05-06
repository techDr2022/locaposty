// Add id to the NextAuth session user type
import { DefaultSession } from "next-auth";
import { SubscriptionPlan, SubscriptionStatus } from "@/lib/generated/prisma";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      subscriptionPlan?: SubscriptionPlan;
      subscriptionStatus?: SubscriptionStatus;
      trialStartedAt?: Date | null;
      trialEndsAt?: Date | null;
      currentPeriodStart?: Date | null;
      currentPeriodEnd?: Date | null;
    } & DefaultSession["user"];
  }
}
