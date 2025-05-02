# Google My Business Auto-Reply System

This document provides details on the Google My Business Auto-Reply system in Locaposty.

## Overview

The auto-reply system automatically fetches new reviews from connected Google Business Profile locations, generates AI-powered responses, and can optionally post those responses automatically.

## Features

### 1. Automatic Review Fetching

- Periodically fetches reviews from all connected GMB locations
- Stores reviews in the database with metadata (rating, time, location ID)
- Tracks which reviews have already been processed
- Uses the `lastFetchedTimestamp` to efficiently fetch only new reviews

### 2. AI-Powered Reply Generation

- Uses OpenAI API to generate contextually relevant replies
- Analyzes sentiment of reviews (positive, neutral, negative)
- Customizes responses based on review content and sentiment
- Supports different tones (friendly, formal, apologetic)

### 3. Auto-Post Capability

- Can be configured to automatically post replies to Google
- Updates database with status information

### 4. Per-Location Settings

- Enable/disable auto-reply per location
- Enable/disable auto-posting per location
- Set preferred tone for AI-generated replies

### 5. Manual Review & Editing

- All AI-generated replies can be reviewed before posting
- Support for manual editing and improvement
- Tracking of reply status (pending, auto-posted, manual-posted)

## Database Schema

The system uses the following database tables:

- `Location`: Stores location information and auto-reply settings

  - `lastFetchedTimestamp`: Tracks when reviews were last fetched
  - `autoReplyEnabled`: Flag to enable/disable auto-reply
  - `autoPostEnabled`: Flag to enable/disable auto-post
  - `replyTonePreference`: Preferred tone for generated replies

- `Review`: Stores review information

  - `isProcessed`: Flag indicating if the review has been processed by auto-reply

- `ReviewReply`: Stores reply information
  - `source`: Indicates if the reply was manually created, AI generated, or auto-posted

## API Endpoints

- `GET /api/reviews/latest`: Fetches latest reviews from GMB
- `POST /api/reviews/autoReply/process`: Processes unprocessed reviews and generates replies
- `POST /api/reviews/sync`: Manually triggers review fetching
- `PATCH /api/locations/[locationId]/settings`: Updates auto-reply settings for a location

## Scheduled Tasks

The system includes scheduled tasks managed by the worker:

- `fetch-latest-reviews`: Runs every 15 minutes to fetch new reviews
- `process-auto-replies`: Runs every 30 minutes to process and generate replies

## Getting Started

1. **Set up environment variables**:

   - `OPENAI_API_KEY`: Your OpenAI API key for AI-generated replies

2. **Enable auto-reply for locations**:

   - Go to Settings → Review Management
   - Configure auto-reply settings for each location

3. **Monitor review responses**:
   - Check the Reviews dashboard to monitor responses
   - Review pending AI-generated replies before posting (if auto-post is disabled)

## Best Practices

1. Start with auto-post disabled to review AI-generated replies first
2. Use the appropriate tone setting based on your business style
3. Regularly check the quality of auto-generated replies
4. Consider creating custom templates for specific situations
