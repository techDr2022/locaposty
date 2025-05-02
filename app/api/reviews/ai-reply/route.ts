import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey:
    "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",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, tone = "FRIENDLY" } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        location: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Get user's organization to check for AI templates
    const userOrganizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        aiTemplates: {
          where: {
            sentiment: review.sentiment || "NEUTRAL",
            tone: tone,
          },
        },
      },
    });

    // Check if we have a template to use as a reference
    let templateReference = "";
    for (const org of userOrganizations) {
      if (org.aiTemplates.length > 0) {
        // Use the first matching template as reference
        templateReference = org.aiTemplates[0].content;
        break;
      }
    }

    const businessName = review.location.name;
    const rating = review.rating;
    const sentiment = review.sentiment || "NEUTRAL";
    const reviewContent = review.comment || "";

    // Create a prompt for OpenAI
    let prompt = `Write a professional and ${tone.toLowerCase()} response to this customer review for ${businessName}:

Review: "${reviewContent}"
Rating: ${rating} out of 5 stars
Sentiment: ${sentiment}

`;

    // Add specific instructions based on rating and sentiment
    if (rating >= 4 || sentiment === "POSITIVE") {
      prompt +=
        "This is a positive review, so express gratitude and enthusiasm.";
    } else if (rating === 3 || sentiment === "NEUTRAL") {
      prompt +=
        "This is a neutral review, so be appreciative but acknowledge room for improvement.";
    } else {
      prompt +=
        "This is a negative review, so be apologetic and offer to address their concerns.";
    }

    // If we have a template reference, include it
    if (templateReference) {
      prompt += `\n\nHere's an example of our preferred response style: "${templateReference}"`;
    }

    // Call OpenAI API to generate a reply
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional customer service representative responding to customer reviews. Keep responses concise, friendly, and authentic.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    // Extract the generated text
    const aiGeneratedReply =
      completion.choices[0]?.message.content?.trim() ||
      "Thank you for your review.";

    // Return the AI-generated reply
    return NextResponse.json({
      success: true,
      reply: {
        content: aiGeneratedReply,
        tone: tone,
        source: "AI_GENERATED",
      },
    });
  } catch (error) {
    console.error("Error generating AI reply:", error);
    return NextResponse.json(
      { error: "Failed to generate AI reply" },
      { status: 500 }
    );
  }
}
