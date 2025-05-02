
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  emailVerificationToken: 'emailVerificationToken',
  password: 'password',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  googleAccessToken: 'googleAccessToken',
  googleRefreshToken: 'googleRefreshToken',
  googleTokenExpiresAt: 'googleTokenExpiresAt',
  subscriptionId: 'subscriptionId',
  subscriptionStatus: 'subscriptionStatus',
  subscriptionPlan: 'subscriptionPlan',
  trialStartedAt: 'trialStartedAt',
  trialEndsAt: 'trialEndsAt',
  currentPeriodStart: 'currentPeriodStart',
  currentPeriodEnd: 'currentPeriodEnd',
  razorpayCustomerId: 'razorpayCustomerId',
  razorpayPaymentId: 'razorpayPaymentId',
  razorpayOrderId: 'razorpayOrderId'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  logo: 'logo',
  ownerId: 'ownerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  organizationId: 'organizationId',
  gmbLocationId: 'gmbLocationId',
  gmbLocationName: 'gmbLocationName',
  address: 'address',
  phone: 'phone',
  websiteUrl: 'websiteUrl',
  latitude: 'latitude',
  longitude: 'longitude',
  timezone: 'timezone',
  isVerified: 'isVerified',
  lastSyncedAt: 'lastSyncedAt',
  lastFetchedTimestamp: 'lastFetchedTimestamp',
  autoReplyEnabled: 'autoReplyEnabled',
  autoPostEnabled: 'autoPostEnabled',
  replyTonePreference: 'replyTonePreference',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  tokenExpiresAt: 'tokenExpiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  logoUrl: 'logoUrl',
  gmbAccountId: 'gmbAccountId'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  locationId: 'locationId',
  userId: 'userId',
  title: 'title',
  content: 'content',
  type: 'type',
  mediaUrls: 'mediaUrls',
  scheduledAt: 'scheduledAt',
  publishedAt: 'publishedAt',
  status: 'status',
  eventStart: 'eventStart',
  eventEnd: 'eventEnd',
  offerStart: 'offerStart',
  offerEnd: 'offerEnd',
  couponCode: 'couponCode',
  callToAction: 'callToAction',
  recurType: 'recurType',
  recurEndsAt: 'recurEndsAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  locationId: 'locationId',
  reviewId: 'reviewId',
  authorName: 'authorName',
  authorPhoto: 'authorPhoto',
  rating: 'rating',
  comment: 'comment',
  createTime: 'createTime',
  updateTime: 'updateTime',
  status: 'status',
  isProcessed: 'isProcessed',
  sentiment: 'sentiment',
  language: 'language',
  isReplyNeeded: 'isReplyNeeded',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewReplyScalarFieldEnum = {
  id: 'id',
  reviewId: 'reviewId',
  userId: 'userId',
  content: 'content',
  source: 'source',
  tone: 'tone',
  isPublished: 'isPublished',
  publishedAt: 'publishedAt',
  aiTemplateId: 'aiTemplateId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIReplyTemplateScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  content: 'content',
  tone: 'tone',
  sentiment: 'sentiment',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InsightScalarFieldEnum = {
  id: 'id',
  locationId: 'locationId',
  date: 'date',
  type: 'type',
  value: 'value',
  createdAt: 'createdAt'
};

exports.Prisma.ReportScalarFieldEnum = {
  id: 'id',
  locationId: 'locationId',
  name: 'name',
  startDate: 'startDate',
  endDate: 'endDate',
  reportType: 'reportType',
  fileUrl: 'fileUrl',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportJobScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  locations: 'locations',
  frequency: 'frequency',
  emailRecipients: 'emailRecipients',
  isActive: 'isActive',
  lastRunAt: 'lastRunAt',
  nextRunAt: 'nextRunAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SearchKeywordScalarFieldEnum = {
  id: 'id',
  keyword: 'keyword',
  locationId: 'locationId',
  latitude: 'latitude',
  longitude: 'longitude',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RankTrackingResultScalarFieldEnum = {
  id: 'id',
  keywordId: 'keywordId',
  rankPosition: 'rankPosition',
  searchDate: 'searchDate',
  searchUrl: 'searchUrl',
  businessUrl: 'businessUrl',
  businessName: 'businessName',
  htmlSnapshot: 'htmlSnapshot',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.SubscriptionStatus = exports.$Enums.SubscriptionStatus = {
  INACTIVE: 'INACTIVE',
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
};

exports.SubscriptionPlan = exports.$Enums.SubscriptionPlan = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE'
};

exports.ReplyTone = exports.$Enums.ReplyTone = {
  FORMAL: 'FORMAL',
  FRIENDLY: 'FRIENDLY',
  APOLOGETIC: 'APOLOGETIC'
};

exports.PostType = exports.$Enums.PostType = {
  WHATS_NEW: 'WHATS_NEW',
  EVENT: 'EVENT',
  OFFER: 'OFFER'
};

exports.PostStatus = exports.$Enums.PostStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
  DELETED: 'DELETED'
};

exports.RecurType = exports.$Enums.RecurType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

exports.ReviewStatus = exports.$Enums.ReviewStatus = {
  PENDING: 'PENDING',
  REPLIED: 'REPLIED',
  FLAGGED: 'FLAGGED'
};

exports.SentimentType = exports.$Enums.SentimentType = {
  POSITIVE: 'POSITIVE',
  NEUTRAL: 'NEUTRAL',
  NEGATIVE: 'NEGATIVE'
};

exports.ReplySource = exports.$Enums.ReplySource = {
  MANUAL: 'MANUAL',
  AI_GENERATED: 'AI_GENERATED',
  AUTO_POSTED: 'AUTO_POSTED'
};

exports.InsightType = exports.$Enums.InsightType = {
  VIEWS: 'VIEWS',
  SEARCHES: 'SEARCHES',
  CLICKS: 'CLICKS',
  DIRECTION_REQUESTS: 'DIRECTION_REQUESTS',
  PHONE_CALLS: 'PHONE_CALLS',
  PHOTOS_VIEWED: 'PHOTOS_VIEWED',
  PHOTO_QUANTITY: 'PHOTO_QUANTITY',
  WEBSITE_CLICKS: 'WEBSITE_CLICKS',
  CALL_CLICKS: 'CALL_CLICKS',
  BUSINESS_IMPRESSIONS_MOBILE_MAPS: 'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
  BUSINESS_IMPRESSIONS_MOBILE_SEARCH: 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
  BUSINESS_IMPRESSIONS_DESKTOP_MAPS: 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
  BUSINESS_BOOKINGS: 'BUSINESS_BOOKINGS',
  BUSINESS_FOOD_ORDERS: 'BUSINESS_FOOD_ORDERS',
  BUSINESS_FOOD_MENU_CLICKS: 'BUSINESS_FOOD_MENU_CLICKS',
  BUSINESS_CONVERSATIONS: 'BUSINESS_CONVERSATIONS'
};

exports.ReportType = exports.$Enums.ReportType = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM: 'CUSTOM'
};

exports.ReportStatus = exports.$Enums.ReportStatus = {
  GENERATING: 'GENERATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.ReportFrequency = exports.$Enums.ReportFrequency = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

exports.Prisma.ModelName = {
  User: 'User',
  Session: 'Session',
  Organization: 'Organization',
  Location: 'Location',
  Post: 'Post',
  Review: 'Review',
  ReviewReply: 'ReviewReply',
  AIReplyTemplate: 'AIReplyTemplate',
  Insight: 'Insight',
  Report: 'Report',
  ReportJob: 'ReportJob',
  SearchKeyword: 'SearchKeyword',
  RankTrackingResult: 'RankTrackingResult'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
