/**
 * Polymarket API
 * Unified export for all API services
 */

import { apiClient } from './client';
import { marketsService } from './services/markets';
import { eventsService } from './services/events';
import { tagsService } from './services/tags';
import { sportsService } from './services/sports';
import { searchService } from './services/search';

// Re-export everything
export { apiClient, ApiClient } from './client';
export { API_CONFIG, API_ENDPOINTS } from './config';

// Services
export { marketsService, MarketsService } from './services/markets';
export { eventsService, EventsService } from './services/events';
export { tagsService, TagsService } from './services/tags';
export { sportsService, SportsService } from './services/sports';
export { searchService, SearchService } from './services/search';

// Types
export type * from '@/types/polymarket';

/**
 * Main API object with all services
 * Usage: import { polymarketApi } from '@/lib/api'
 */
export const polymarketApi = {
  markets: marketsService,
  events: eventsService,
  tags: tagsService,
  sports: sportsService,
  search: searchService,
  
  // Health check
  healthCheck: () => apiClient.healthCheck(),
} as const;

