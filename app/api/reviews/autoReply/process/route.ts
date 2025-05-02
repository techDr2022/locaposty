import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { refreshLocationToken } from "@/lib/refreshLocationToken";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    // Get all locations with auto-reply enabled
    const locations = await prisma.location.findMany({
      where: {
        autoReplyEnabled: true,
        accessToken: { not: null },
        refreshToken: { not: null },
      },
    });

    const results = [];

    for (const location of locations) {
      try {
        // Get unprocessed reviews for this location
        const unprocessedReviews = await prisma.review.findMany({
          where: {
            locationId: location.id,
            isProcessed: false,
          },
        });

        if (unprocessedReviews.length === 0) {
          continue;
        }

        // Process each review
        for (const review of unprocessedReviews) {
          // Only generate replies for reviews with comments
          if (!review.comment) {
            await prisma.review.update({
              where: { id: review.id },
              data: { isProcessed: true },
            });
            continue;
          }

          try {
            // Get review sentiment using OpenAI
            const sentimentAnalysis = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content:
                    "You analyze the sentiment of customer reviews. Respond with POSITIVE, NEUTRAL, or NEGATIVE only.",
                },
                {
                  role: "user",
                  content: `Analyze the sentiment of this review: "${review.comment}"`,
                },
              ],
            });

            const sentiment = sentimentAnalysis.choices[0].message.content
              ?.trim()
              .toUpperCase();

            // Map sentiment to our enum
            let sentimentType: "POSITIVE" | "NEUTRAL" | "NEGATIVE" = "NEUTRAL";
            if (sentiment === "POSITIVE") sentimentType = "POSITIVE";
            if (sentiment === "NEGATIVE") sentimentType = "NEGATIVE";

            // Update review sentiment
            await prisma.review.update({
              where: { id: review.id },
              data: {
                sentiment: sentimentType,
                isProcessed: true,
              },
            });

            // Generate AI reply based on review content and sentiment
            const templatePrompt = `
              You are a helpful customer service representative for a business. 
              Tone preference: ${location.replyTonePreference || "FRIENDLY"}
              
              Write a reply to this ${sentimentType.toLowerCase()} review:
              "Rating: ${review.rating}/5
              Review: ${review.comment}"
              
              Keep it under 1000 characters, professional, and authentic. Do not use generic placeholder text.
              For negative reviews, be empathetic and offer solutions.
              For positive reviews, express gratitude and invite the customer back.
              Do not repeat the exact review content back to them.
            `;

            const completion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: templatePrompt,
                },
              ],
            });

            const generatedReply =
              completion.choices[0].message.content?.trim();

            if (!generatedReply) {
              return NextResponse.json(
                { error: "Failed to process cannot generateReply" },
                { status: 500 }
              );
            }

            // Create reply in database
            const reply = await prisma.reviewReply.create({
              data: {
                reviewId: review.id,
                content: generatedReply,
                source: "AI_GENERATED",
                tone: location.replyTonePreference || "FRIENDLY",
                isPublished: false,
              },
            });

            // Auto-post the reply if enabled for this location
            if (location.autoPostEnabled) {
              try {
                const token = await refreshLocationToken(location.id);

                // Construct the account name from the location's gmbAccountId
                const accountName = `${location.gmbAccountId}`;

                // Only proceed if we have a valid account ID
                if (location.gmbAccountId) {
                  await fetch(
                    `https://mybusiness.googleapis.com/v4/${accountName}/locations/${location.gmbLocationId}/reviews/${review.reviewId}/reply`,
                    {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ comment: generatedReply }),
                    }
                  );

                  // Update reply as published
                  await prisma.reviewReply.update({
                    where: { id: reply.id },
                    data: {
                      isPublished: true,
                      publishedAt: new Date(),
                      source: "AUTO_POSTED",
                    },
                  });

                  // Update review status
                  await prisma.review.update({
                    where: { id: review.id },
                    data: { status: "REPLIED" },
                  });

                  results.push({
                    reviewId: review.id,
                    action: "auto-replied-and-posted",
                  });
                } else {
                  console.error(
                    `Missing gmbAccountId for location ${location.id}`
                  );
                  results.push({
                    reviewId: review.id,
                    action: "error",
                    error: "Missing Google My Business account ID",
                  });
                }
              } catch (postError) {
                console.error(
                  `Error posting reply for review ${review.id}:`,
                  postError
                );
                results.push({
                  reviewId: review.id,
                  action: "error",
                  error:
                    postError instanceof Error
                      ? postError.message
                      : "Unknown error during posting",
                });
              }
            } else {
              results.push({
                reviewId: review.id,
                action: "reply-generated-pending-approval",
              });
            }
          } catch (error) {
            console.error(`Error processing review ${review.id}:`, error);
            results.push({
              reviewId: review.id,
              action: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      } catch (error) {
        console.error(`Error processing location ${location.id}:`, error);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Failed to process auto-replies:", error);
    return NextResponse.json(
      { error: "Failed to process auto-replies" },
      { status: 500 }
    );
  }
}
