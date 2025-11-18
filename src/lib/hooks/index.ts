/**
 * React Hooks for Polymarket API
 * Unified export for all custom hooks
 */

// Markets hooks
export {
  useMarkets,
  useMarket,
  useMarketBySlug,
  useActiveMarkets,
  useTopVolumeMarkets,
} from './useMarkets';

// Events hooks (RECOMMENDED)
export {
  useEvents,
  useEvent,
  useEventBySlug,
  useActiveEvents,
  useTrendingEvents,
  useEventsByCategory,
} from './useEvents';

// Export hook types
export type { UseMarketsOptions, UseMarketsResult, UseMarketOptions, UseMarketResult } from './useMarkets';
export type { UseEventsOptions, UseEventsResult, UseEventOptions, UseEventResult } from './useEvents';





