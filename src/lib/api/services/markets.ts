/**
 * Markets Service
 * API methods for market-related endpoints
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Market, MarketQueryParams } from '@/types/polymarket';

export class MarketsService {
  /**
   * Get list of markets with optional filtering
   */
  async getMarkets(params?: MarketQueryParams): Promise<Market[]> {
    return apiClient.get<Market[]>(API_ENDPOINTS.markets, params);
  }

  /**
   * Get a specific market by ID
   */
  async getMarketById(
    id: string,
    includeTag: boolean = false
  ): Promise<Market> {
    return apiClient.get<Market>(API_ENDPOINTS.marketById(id), {
      include_tag: includeTag,
    });
  }

  /**
   * Get a specific market by slug (RECOMMENDED)
   */
  async getMarketBySlug(
    slug: string,
    includeTag: boolean = false
  ): Promise<Market> {
    return apiClient.get<Market>(API_ENDPOINTS.marketBySlug(slug), {
      include_tag: includeTag,
    });
  }

  /**
   * Get markets by tag ID
   */
  async getMarketsByTag(
    tagId: number | string,
    params?: Omit<MarketQueryParams, 'tag_id'>
  ): Promise<Market[]> {
    return this.getMarkets({
      ...params,
      tag_id: tagId,
    });
  }

  /**
   * Get active markets only
   */
  async getActiveMarkets(params?: MarketQueryParams): Promise<Market[]> {
    return this.getMarkets({
      ...params,
      closed: false,
    });
  }

  /**
   * Get markets with highest volume
   */
  async getTopVolumeMarkets(
    limit: number = 20,
    params?: Omit<MarketQueryParams, 'limit' | 'order' | 'ascending'>
  ): Promise<Market[]> {
    return this.getMarkets({
      ...params,
      limit,
      order: 'volume24hr',
      ascending: false,
      closed: false,
    });
  }
}

export const marketsService = new MarketsService();





