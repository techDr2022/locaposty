import NextAuth from "next-auth/next";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

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
          let dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          console.log(
            "Google user lookup result:",
            dbUser ? "Found" : "Not found"
          );

          if (!dbUser) {
            console.log("Creating new user from Google profile");
            console.log("Profile data:", {
              email: profile.email,
              name: profile.name,
              image: profile.image,
            });

            dbUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || "Google User",
                emailVerified: new Date(),
                password: "",
                image: profile.image,
              },
            });
            console.log("New user created with ID:", dbUser.id);
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

      if (account && user) {
        console.log("JWT: User from callback:", user.email);

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email || "" },
          });

          console.log(
            "JWT: Database user lookup result:",
            dbUser ? "Found" : "Not found"
          );

          if (dbUser) {
            console.log("JWT: Setting token ID to:", dbUser.id);
            token.id = dbUser.id;
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
        }
      }
      return token;
    },
    async session(params) {
      console.log("Session callback called");
      const { session, token } = params;
      console.log("Session token ID:", token.id);

      if (session.user && token.id) {
        console.log("Setting session user ID to:", token.id);
        session.user.id = token.id as string;
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
