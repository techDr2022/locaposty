import * as dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "./lib/generated/prisma";

// Add startup log to ensure logging is working
console.log("======= WORKER STARTING =======");
console.log("Environment:", process.env.NODE_ENV || "development");

try {
  const prisma = new PrismaClient();
  const app = express();
  const port = process.env.PORT || 3001;

  // Health check endpoint
  app.get("/ping", (_req: Request, res: Response) => {
    res.send("pong");
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Worker server listening on port ${port}`);
  });

  // Set up Redis connection
  console.log("Setting up Redis connection...");
  console.log(`Redis host: ${process.env.REDIS_HOST || "localhost"}`);
  console.log(`Redis port: ${process.env.REDIS_PORT || "6379"}`);

  const redisOptions = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };

  // Create Redis connection with explicit error handling
  const connection = new IORedis(redisOptions);

  // Handle Redis connection events
  connection.on("connect", () => {
    console.log("Successfully connected to Redis");
  });

  connection.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  // Try to ping Redis to verify connection
  connection
    .ping()
    .then(() => {
      console.log("Redis PING successful");
    })
    .catch((err) => {
      console.error("Redis PING failed:", err);
    });

  // Function to refresh location access token
  async function refreshLocationToken(locationId: string): Promise<string> {
    try {
      console.log(`[TOKEN] Fetching tokens for location ${locationId}`);

      // Get location with tokens
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        throw new Error(`Location ${locationId} not found`);
      }

      if (!location.refreshToken) {
        throw new Error(`No refresh token found for location ${locationId}`);
      }

      console.log(`[TOKEN] Found refresh token for location ${locationId}`);

      // Check if current token is still valid
      if (location.accessToken && location.tokenExpiresAt) {
        const now = new Date();
        const expiryDate = new Date(location.tokenExpiresAt);

        // If token is still valid (with 5 minute buffer), return it
        if (expiryDate > new Date(now.getTime() + 5 * 60 * 1000)) {
          console.log(
            `[TOKEN] Using existing valid token for location ${locationId}`
          );
          return location.accessToken;
        }
      }

      // Token expired or missing, refresh it
      console.log(`[TOKEN] Refreshing token for location ${locationId}`);
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID_GMB,
        process.env.GOOGLE_CLIENT_SECRET_GMB,
        `${process.env.NEXTAUTH_URL}/api/google/auth/callback`
      );

      // Log the OAuth configuration for debugging
      console.log(
        `[TOKEN] OAuth2 client ID: ${process.env.GOOGLE_CLIENT_ID_GMB?.substring(0, 5)}...`
      );
      console.log(
        `[TOKEN] OAuth2 callback URL: ${process.env.NEXTAUTH_URL}/api/google/auth/callback`
      );

      oauth2Client.setCredentials({
        refresh_token: location.refreshToken,
      });

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        if (!credentials.access_token) {
          throw new Error(
            `Failed to refresh access token for location ${locationId}`
          );
        }

        // Calculate expiry time
        const expiryTime = new Date();
        if (credentials.expiry_date) {
          expiryTime.setTime(credentials.expiry_date);
        } else {
          // Default expiry: 1 hour
          expiryTime.setTime(expiryTime.getTime() + 60 * 60 * 1000);
        }

        // Update location with new token
        await prisma.location.update({
          where: { id: locationId },
          data: {
            accessToken: credentials.access_token,
            tokenExpiresAt: expiryTime,
          },
        });

        console.log(
          `[TOKEN] Successfully refreshed token for location ${locationId}`
        );
        return credentials.access_token;
      } catch (refreshError) {
        console.error(`[TOKEN ERROR] OAuth refresh failed:`, refreshError);

        // Mark the refresh token as invalid by clearing it
        await prisma.location.update({
          where: { id: locationId },
          data: {
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
          },
        });

        throw new Error(
          `Token refresh failed. The location needs to be re-authenticated.`
        );
      }
    } catch (error) {
      console.error(
        `[TOKEN ERROR] Failed to refresh token for location ${locationId}:`,
        error
      );
      throw error;
    }
  }

  // Define job data interface
  interface JobData {
    postId: string;
    userId: string;
  }

  // Create worker
  const worker = new Worker<JobData>(
    "gmb-locaposty",
    async (job: Job<JobData>) => {
      try {
        console.log(
          `[WORKER] Processing job ${job.id}: ${JSON.stringify(job.data)}`
        );

        const { postId } = job.data; // Remove unused userId parameter

        // Fetch post from database
        const post = await prisma.post.findUnique({
          where: { id: postId },
          include: { location: true },
        });

        if (!post) {
          throw new Error(`Post ${postId} not found`);
        }

        // For immediate publishing, the status will be PUBLISHED
        // For scheduled publishing, the status will be SCHEDULED
        if (post.status !== "SCHEDULED" && post.status !== "PUBLISHED") {
          console.log(
            `[WORKER] Post ${postId} is not scheduled or published, skipping`
          );
          return;
        }

        // Get location
        const location = post.location;
        if (!location || !location.gmbLocationId) {
          throw new Error(`No GMB location found for post ${postId}`);
        }

        if (!location.gmbAccountId) {
          throw new Error(
            `No GMB account ID found for location ${location.id}`
          );
        }

        // Check if location has refresh token
        if (!location.refreshToken) {
          await prisma.post.update({
            where: { id: postId },
            data: {
              status: "FAILED",
            },
          });
          throw new Error(
            `Location ${location.id} has no refresh token. Please reconnect the location to Google.`
          );
        }

        // Function to create GMB API url
        const createGmbUrl = (url: string): string => {
          return `https://mybusiness.googleapis.com/v4/${url}`;
        };

        // Refresh access token using location data, not user data
        console.log(
          `[WORKER] Getting access token for location ${location.id}`
        );

        let accessToken;
        try {
          accessToken = await refreshLocationToken(location.id);
        } catch (tokenError) {
          console.error(`[WORKER] Token refresh failed:`, tokenError);

          // Update post to failed status
          await prisma.post.update({
            where: { id: postId },
            data: {
              status: "FAILED",
            },
          });

          throw new Error(
            `Authentication failed for location ${location.id}. Location needs to be reconnected to Google.`
          );
        }

        // Prepare topic type and event details
        let topicType = "STANDARD";
        let eventDetails:
          | {
              title?: string;
              schedule?: {
                startTime: string;
                endTime?: string;
              };
            }
          | undefined = undefined;

        let offerDetails:
          | {
              couponCode?: string;
              redeemOnlineUrl?: string;
              termsConditions?: string;
              startTime?: string;
              endTime?: string;
            }
          | undefined = undefined;

        const callToActionType = post.callToAction || undefined;

        if (post.type === "EVENT" && post.eventStart) {
          topicType = "EVENT";
          eventDetails = {
            title: post.title,
            schedule: {
              startTime: post.eventStart.toISOString(),
              endTime: post.eventEnd?.toISOString(),
            },
          };
        } else if (post.type === "OFFER") {
          topicType = "OFFER";
          offerDetails = {
            couponCode: post.couponCode as string | undefined,
            // Since offerUrl and offerTerms don't exist in the schema, we'll use undefined
            redeemOnlineUrl: undefined,
            termsConditions: undefined,
          };

          if (post.offerStart && offerDetails) {
            offerDetails.startTime = post.offerStart.toISOString();
          }

          if (post.offerEnd && offerDetails) {
            offerDetails.endTime = post.offerEnd.toISOString();
          }
        }

        // Build post request body
        interface PostBody {
          languageCode: string;
          summary: string;
          topicType: string;
          callToAction?: {
            actionType: string;
            url?: string;
          };
          media?: Array<{
            mediaFormat: string;
            sourceUrl: string;
          }>;
          eventDetails?: {
            title?: string;
            schedule?: {
              startTime: string;
              endTime?: string;
            };
          };
          offerDetails?: {
            couponCode?: string;
            redeemOnlineUrl?: string;
            termsConditions?: string;
            startTime?: string;
            endTime?: string;
          };
        }

        // Define a mapping from our CTA types to Google's CTA types
        const actionTypeMap: Record<string, string> = {
          LEARN_MORE: "LEARN_MORE",
          BOOK: "BOOK",
          ORDER: "ORDER",
          SHOP: "BUY",
          SIGN_UP: "SIGN_UP",
          CALL_NOW: "CALL",
          GET_DIRECTIONS: "DIRECTIONS",
        };

        // Set up call to action if specified
        let callToActionObj = undefined;
        if (callToActionType && callToActionType !== "NONE") {
          // Map our CTA type to Google's format if needed
          const googleActionType =
            actionTypeMap[callToActionType] || callToActionType;

          // Create the call to action object with the correct action type
          callToActionObj = {
            actionType: googleActionType,
          };

          // Note: In the future, we could add support for URL fields
          // For CALL action type, Google automatically uses the location's phone number
          // For other types, we'd ideally have URLs specified
        }

        const postBody: PostBody = {
          languageCode: "en-US",
          summary: post.content,
          topicType,
          callToAction: callToActionObj,
          media:
            post.mediaUrls.length > 0
              ? post.mediaUrls.map((url) => ({
                  mediaFormat: url.toLowerCase().endsWith(".mp4")
                    ? "VIDEO"
                    : "PHOTO",
                  sourceUrl: url,
                }))
              : undefined,
          eventDetails,
          offerDetails,
        };

        // Send request to GMB API
        const accountId = location.gmbAccountId?.startsWith("accounts/")
          ? location.gmbAccountId.replace("accounts/", "")
          : location.gmbAccountId;

        const locationId = location.gmbLocationId?.startsWith("locations/")
          ? location.gmbLocationId.replace("locations/", "")
          : location.gmbLocationId;

        const apiUrl = createGmbUrl(
          `accounts/${accountId}/locations/${locationId}/localPosts`
        );

        console.log(`[WORKER] Sending post to GMB API: ${apiUrl}`);
        console.log(
          `[WORKER] Request body: ${JSON.stringify(postBody, null, 2)}`
        );

        const response = await axios.post(apiUrl, postBody, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        // Update post status in database
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            // gmbPostName doesn't exist in the schema, so we won't update it
          },
        });

        console.log(`[WORKER] Post ${postId} published successfully to GMB`);
        return response.data;
      } catch (error: unknown) {
        console.error("[WORKER ERROR] Error processing job:", error);

        // Determine appropriate error message and code
        let errorMessage = "Unknown error";
        let errorCode = "UNKNOWN_ERROR";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Check for specific error types from axios
        interface AxiosError {
          response?: {
            status: number;
            data: {
              error?: {
                message?: string;
              };
              [key: string]: unknown;
            };
          };
          request?: unknown;
          message?: string;
        }

        const axiosError = error as AxiosError;
        if (axiosError.response) {
          // HTTP error response from GMB API
          const status = axiosError.response.status;
          const responseData = axiosError.response.data;

          errorMessage = `GMB API Error (${status}): ${
            responseData.error?.message || JSON.stringify(responseData)
          }`;

          // Set error code based on status
          if (status === 401 || status === 403) {
            errorCode = "AUTH_ERROR";
          } else if (status === 400) {
            errorCode = "INVALID_REQUEST";
          } else if (status === 404) {
            errorCode = "RESOURCE_NOT_FOUND";
          } else if (status >= 500) {
            errorCode = "GMB_SERVER_ERROR";
          }
        } else if (axiosError.request) {
          // Request was made but no response received
          errorMessage = "No response received from GMB API";
          errorCode = "NETWORK_ERROR";
        }

        // Update post status on error
        try {
          console.log(
            `[WORKER] Updating post ${job.data.postId} with failure details`
          );
          // Store the error message somewhere (we could log it or use console.error)
          console.error(`[ERROR DETAILS] ${errorMessage} (${errorCode})`);

          await prisma.post.update({
            where: { id: job.data.postId },
            data: {
              status: "FAILED",
              // error and errorCode don't exist in the schema, so we won't update them
              // We'll just update the status to FAILED without storing the error details
            },
          });
          console.log(
            `[WORKER] Post ${job.data.postId} marked as failed in database`
          );
        } catch (dbError) {
          console.error(
            "[WORKER ERROR] Failed to update post status:",
            dbError
          );
        }

        throw error;
      }
    },
    { connection }
  );

  // Handle worker events
  worker.on("completed", (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
    console.log(`[BullMQ Worker] Job data: ${JSON.stringify(job.data)}`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[BullMQ Worker] Job ${job?.id} failed with error: ${error.message}`
    );
    console.error(`[BullMQ Worker] Job data: ${JSON.stringify(job?.data)}`);
  });

  worker.on("active", (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} has started processing`);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[BullMQ Worker] Job ${jobId} has stalled`);
  });

  // Handle graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("Shutting down worker...");
    await worker.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down worker...");
    await worker.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  });

  console.log("Worker started for queue: gmb-locaposty");

  // Define the Task interface
  interface Task {
    id: string;
    name: string;
    schedule: string;
    handler: () => Promise<any>;
  }

  // Define tasks list
  const reviewTasks: Task[] = [
    // Fetch latest reviews every 15 minutes
    {
      id: "fetch-latest-reviews",
      name: "Fetch Latest Reviews",
      schedule: "*/15 * * * *", // Every 15 minutes
      handler: async () => {
        console.log("Fetching latest reviews...");
        try {
          // Call the API route to fetch latest reviews
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/reviews/latest`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                // Add server-side authentication token if needed
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch reviews: ${response.statusText}`);
          }

          const data = await response.json();
          console.log(`Fetched reviews: ${JSON.stringify(data.results)}`);
          return { success: true, results: data.results };
        } catch (error: any) {
          console.error("Error fetching reviews:", error);
          return { success: false, error: error.message };
        }
      },
    },

    // Process auto-replies for new reviews every 30 minutes
    {
      id: "process-auto-replies",
      name: "Process Auto-Replies",
      schedule: "*/30 * * * *", // Every 30 minutes
      handler: async () => {
        console.log("Processing auto-replies for reviews...");
        try {
          // Call the API route to process auto-replies
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/reviews/autoReply/process`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // Add server-side authentication token if needed
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to process auto-replies: ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log(
            `Processed auto-replies: ${JSON.stringify(data.results)}`
          );
          return { success: true, results: data.results };
        } catch (error: any) {
          console.error("Error processing auto-replies:", error);
          return { success: false, error: error.message };
        }
      },
    },
  ];

  // In your worker initialization, register these tasks
  for (const task of reviewTasks) {
    try {
      await worker.cron(task.id, task.schedule, task.handler);
      console.log(`Registered cron task: ${task.name}`);
    } catch (error) {
      console.error(`Failed to register task ${task.name}:`, error);
    }
  }
} catch (error) {
  console.error("Worker initialization failed:", error);
  process.exit(1);
}
