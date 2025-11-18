/**
 * Polymarket API Types
 * Complete type definitions for the Polymarket Gamma API
 */

// ============================================================================
// MARKET TYPES
// ============================================================================

export interface Market {
  id: string;
  question: string | null;
  conditionId: string;
  slug: string | null;
  twitterCardImage?: string | null;
  resolutionSource: string | null;
  endDate: string | null;
  category?: string | null;
  ammType?: string | null;
  liquidity: string | null;
  sponsorName?: string | null;
  sponsorImage?: string | null;
  startDate: string | null;
  xAxisValue?: string | null;
  yAxisValue?: string | null;
  denominationToken?: string | null;
  fee?: string | null;
  image: string | null;
  icon: string | null;
  lowerBound?: string | null;
  upperBound?: string | null;
  description: string | null;
  outcomes: string | null;
  outcomePrices?: string | null;
  volume: string | null;
  active: boolean | null;
  marketType?: string | null;
  formatType?: string | null;
  lowerBoundDate?: string | null;
  upperBoundDate?: string | null;
  closed: boolean | null;
  marketMakerAddress: string;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  closedTime?: string | null;
  wideFormat?: boolean | null;
  new: boolean | null;
  mailchimpTag?: string | null;
  featured: boolean | null;
  archived: boolean | null;
  resolvedBy?: string | null;
  restricted: boolean | null;
  marketGroup?: number | null;
  groupItemTitle?: string | null;
  groupItemThreshold?: string | null;
  questionID?: string | null;
  umaEndDate?: string | null;
  enableOrderBook: boolean | null;
  orderPriceMinTickSize?: number | null;
  orderMinSize?: number | null;
  umaResolutionStatus?: string | null;
  curationOrder?: number | null;
  volumeNum: number | null;
  liquidityNum: number | null;
  endDateIso?: string | null;
  startDateIso?: string | null;
  umaEndDateIso?: string | null;
  hasReviewedDates?: boolean | null;
  readyForCron?: boolean | null;
  commentsEnabled: boolean | null;
  volume24hr: number | null;
  volume1wk?: number | null;
  volume1mo?: number | null;
  volume1yr?: number | null;
  gameStartTime?: string | null;
  secondsDelay?: number | null;
  clobTokenIds?: string | null;
  disqusThread?: string | null;
  shortOutcomes?: string | null;
  teamAID?: string | null;
  teamBID?: string | null;
  umaBond?: string | null;
  umaReward?: string | null;
  fpmmLive?: boolean | null;
  volume24hrAmm?: number | null;
  volume1wkAmm?: number | null;
  volume1moAmm?: number | null;
  volume1yrAmm?: number | null;
  volume24hrClob?: number | null;
  volume1wkClob?: number | null;
  volume1moClob?: number | null;
  volume1yrClob?: number | null;
  volumeAmm?: number | null;
  volumeClob?: number | null;
  liquidityAmm?: number | null;
  liquidityClob?: number | null;
  makerBaseFee?: number | null;
  takerBaseFee?: number | null;
  customLiveness?: number | null;
  acceptingOrders?: boolean | null;
  negRisk?: boolean | null;
  ready?: boolean | null;
  funded?: boolean | null;
  cyom?: boolean | null;
  competitive?: number | null;
  pagerDutyNotificationEnabled?: boolean | null;
  approved?: boolean | null;
  rewardsMinSize?: number | null;
  rewardsMaxSpread?: number | null;
  spread?: number | null;
  oneDayPriceChange?: number | null;
  oneHourPriceChange?: number | null;
  oneWeekPriceChange?: number | null;
  oneMonthPriceChange?: number | null;
  oneYearPriceChange?: number | null;
  lastTradePrice?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface Event {
  id: string;
  ticker?: string | null;
  slug: string | null;
  title: string | null;
  subtitle?: string | null;
  description: string | null;
  resolutionSource: string | null;
  startDate: string | null;
  creationDate?: string | null;
  endDate: string | null;
  image: string | null;
  icon: string | null;
  active: boolean | null;
  closed: boolean | null;
  archived: boolean | null;
  new: boolean | null;
  featured: boolean | null;
  restricted: boolean | null;
  liquidity?: number | null;
  volume?: number | null;
  openInterest?: number | null;
  sortBy?: string | null;
  category?: string | null;
  subcategory?: string | null;
  isTemplate?: boolean | null;
  templateVariables?: string | null;
  published_at?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  commentsEnabled?: boolean | null;
  competitive?: number | null;
  volume24hr?: number | null;
  volume1wk?: number | null;
  volume1mo?: number | null;
  volume1yr?: number | null;
  featuredImage?: string | null;
  disqusThread?: string | null;
  parentEvent?: string | null;
  enableOrderBook?: boolean | null;
  liquidityAmm?: number | null;
  liquidityClob?: number | null;
  negRisk?: boolean | null;
  negRiskMarketID?: string | null;
  negRiskFeeBips?: number | null;
  commentCount?: number | null;
  markets?: Market[];
}

// ============================================================================
// TAG TYPES
// ============================================================================

export interface Tag {
  id: string;
  label: string | null;
  slug: string | null;
  forceShow?: boolean | null;
  publishedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  forceHide?: boolean | null;
  isCarousel?: boolean | null;
}

export interface RelatedTag {
  id: string;
  tagID: number | null;
  relatedTagID: number | null;
  rank: number | null;
}

export interface SearchTag extends Tag {
  event_count?: number;
}

// ============================================================================
// SPORTS TYPES
// ============================================================================

export interface SportsMetadata {
  id?: number;
  sport: string;
  image: string;
  resolution: string;
  ordering: string;
  tags: string;
  series: string;
  createdAt?: string;
}

export interface Team {
  id: number;
  name: string | null;
  league: string | null;
  record: string | null;
  logo: string | null;
  abbreviation: string | null;
  alias: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  providerId?: number | null;
  color?: string | null;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchResult {
  events: Event[] | null;
  tags: SearchTag[] | null;
  profiles: any[] | null;
  pagination?: {
    hasMore: boolean;
    totalResults: number;
  };
}

// ============================================================================
// API QUERY PARAMETERS
// ============================================================================

export interface MarketQueryParams {
  limit?: number;
  offset?: number;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
  tag_id?: number | string;
  related_tags?: boolean;
  exclude_tag_id?: number | string;
}

export interface EventQueryParams {
  limit?: number;
  offset?: number;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
  tag_id?: number | string;
  related_tags?: boolean;
  exclude_tag_id?: number | string;
}

export interface TagQueryParams {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  include_template?: boolean;
  is_carousel?: boolean;
}

export interface TeamQueryParams {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  league?: string | string[];
  name?: string | string[];
  abbreviation?: string | string[];
}

export interface SearchQueryParams {
  q: string;
  cache?: boolean;
  events_status?: string;
  limit_per_type?: number;
  page?: number;
  events_tag?: string | string[];
  keep_closed_markets?: number;
  sort?: string;
  ascending?: boolean;
  search_tags?: boolean;
  search_profiles?: boolean;
  recurrence?: string;
  exclude_tag_id?: number | number[];
  optimized?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status?: number;
}





