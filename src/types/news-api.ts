/**
 * Polymarket News API Types
 * Type definitions based on the backend contract
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type MarketStatus = "open" | "resolved" | "paused" | "canceled";

export type MarketResolution = "yes" | "no" | null;

export interface MarketPricing {
  best_bid_yes: number | null;
  best_ask_yes: number | null;
  best_bid_no: number | null;
  best_ask_no: number | null;
  last_price_yes: number | null;
  last_trade_at: string | null; // ISO8601
}

export interface MarketStats {
  volume_24h: number | null;
  liquidity: number | null;
  open_interest: number | null;
}

export type HeadlineSentiment = "bullish" | "bearish" | "neutral";

export interface ApiErrorResponse {
  error: {
    code: string;        // e.g., "NOT_FOUND", "INVALID_INPUT"
    message: string;     // human-readable
    details?: any;       // optional extra info
  }
}

// ============================================================================
// HEADLINES API TYPES
// ============================================================================

export interface MarketSummary {
  id: string;
  polymarket_market_id: string;
  yes_token_id?: string;
  question: string;
  status: MarketStatus;
  resolution: MarketResolution;
  end_date: string | null;
  pricing: MarketPricing;
  stats: MarketStats;
  price_history?: PriceHistoryPoint[];
}

export interface HeadlineItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  source: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  summary: string | null;
  lead: string | null;
  tags: string[];
  markets: MarketSummary[];
}

export interface HeadlinesResponse {
  headlines: HeadlineItem[];
  cursor: string | null;
  has_more: boolean;
}

export interface HeadlinesQueryParams {
  limit?: number;
  cursor?: string;
  marketId?: string;
  polymarketMarketId?: string;
  since?: string;
  source?: string;
}

// ============================================================================
// MARKET API TYPES
// ============================================================================

export interface PriceHistoryPoint {
  timestamp: string;
  yes_price: number;
  no_price: number;
}

export interface MarketExtendedPricing extends MarketPricing {
  price_history: PriceHistoryPoint[];
}

export interface MarketExtendedStats extends MarketStats {
  volume_all_time: number | null;
  trades_24h: number | null;
}

export interface MarketResolutionDetails {
  resolved_at: string | null;
  resolved_by: string | null;      // e.g. "UMA", "Polymarket Oracle"
  resolution_source: string | null;
}

export interface MarketDetail {
  id: string;
  polymarket_market_id: string;
  yes_token_id?: string;
  slug: string;
  question: string;
  description: string | null;
  category: string | null;
  tags: string[];
  status: MarketStatus;
  resolution: MarketResolution;
  created_at: string;
  end_date: string | null;
  pricing: MarketExtendedPricing;
  stats: MarketExtendedStats;
  resolution_details: MarketResolutionDetails;
}

export interface MarketHeadlineDetail {
  id: string;
  title: string;
  slug: string;
  url: string;
  source: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  summary: string | null;
  lead: string | null;
  raw_text_available: boolean;
  sentiment: HeadlineSentiment | null;
  relevance_score: number | null;
  impact_score: number | null;
  topics: string[];
  image_url: string | null;
}

export interface MarketResponse {
  market: MarketDetail;
  headlines: MarketHeadlineDetail[];
  headlinesCursor: string | null;
  headlinesHasMore: boolean;
}

export interface MarketQueryParams {
  marketId?: string;
  polymarketMarketId?: string;
  headlinesLimit?: number;
  headlinesCursor?: string;
}

// ============================================================================
// ALERTS API TYPES
// ============================================================================

export type AlertType = "new_market" | "price_movement";

export interface AlertItem {
  id: string;
  marketId: string;
  question: string;
  type: AlertType;
  priceFrom: number;
  priceTo: number;
  priceChange: number;
  priceChangePercent: number;
  volume24hr: number;
  liquidity: number;
  detectedAt: string; // ISO8601
}

export interface AlertsResponse {
  count: number;
  items: AlertItem[];
}

export interface AlertsQueryParams {
  type?: AlertType;
  limit?: number;
  since?: string; // ISO date string
}

// ============================================================================
// UNIFIED FEED TYPES
// ============================================================================

export type FeedItemType = "headline" | "alert_new_market" | "alert_price_movement";

export interface FeedItem extends HeadlineItem {
  feedType: FeedItemType;
  // Alert-specific fields (only present when feedType is alert_*)
  alertData?: {
    marketId: string;
    priceFrom: number;
    priceTo: number;
    priceChange: number;
    priceChangePercent: number;
    volume24hr: number;
    liquidity: number;
  };
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export type WebSocketMessageType =
  | "subscribe"
  | "unsubscribe"
  | "market_price_update"
  | "market_status_update"
  | "market_headline_created"
  | "error";

export interface WSSubscriptionMessage {
  type: "subscribe";
  markets?: string[];
  polymarketMarketIds?: string[];
}

export interface WSUnsubscriptionMessage {
  type: "unsubscribe";
  markets?: string[];
}

export interface WSMarketPriceUpdate {
  type: "market_price_update";
  market_id: string;
  polymarket_market_id: string;
  timestamp: string;
  yes_price: number;
  no_price: number;
  best_bid_yes: number;
  best_ask_yes: number;
  best_bid_no: number;
  best_ask_no: number;
  volume_24h: number;
  trades_24h: number;
}

export interface WSMarketStatusUpdate {
  type: "market_status_update";
  market_id: string;
  polymarket_market_id: string;
  timestamp: string;
  status: MarketStatus;
  resolution: MarketResolution;
  resolved_at: string;
  resolution_source: string;
}

export interface WSMarketHeadlineCreated {
  type: "market_headline_created";
  market_id: string;
  timestamp: string;
  headline: {
    id: string;
    title: string;
    url: string;
    source: string;
    published_at: string;
    summary: string;
    sentiment: HeadlineSentiment;
    relevance_score: number;
  };
}

export interface WSErrorMessage {
  type: "error";
  error: {
    code: string;
    message: string;
  };
}

export type WebSocketMessage =
  | WSSubscriptionMessage
  | WSUnsubscriptionMessage
  | WSMarketPriceUpdate
  | WSMarketStatusUpdate
  | WSMarketHeadlineCreated
  | WSErrorMessage;

