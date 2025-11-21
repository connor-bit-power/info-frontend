import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { 
  HeadlinesResponse, 
  HeadlinesQueryParams, 
  MarketResponse, 
  MarketQueryParams 
} from '@/types/news-api';

/**
 * Polymarket News API Service
 * Implementation of the news and market data endpoints
 */
export const newsService = {
  /**
   * GET /headlines
   * Returns a list of recent headlines with summary Polymarket data for each headline’s associated market.
   */
  getHeadlines: async (params?: HeadlinesQueryParams): Promise<HeadlinesResponse> => {
    // Convert params to Record<string, any> for the generic client
    const queryParams: Record<string, any> = { ...params };
    return apiClient.get<HeadlinesResponse>(API_ENDPOINTS.headlines, queryParams);
  },

  /**
   * GET /market
   * Returns extended market data plus extended headlines associated with a given market.
   * Must provide exactly one of marketId or polymarketMarketId.
   */
  getMarket: async (params: MarketQueryParams): Promise<MarketResponse> => {
    if (!params.marketId && !params.polymarketMarketId) {
      throw new Error("Must provide exactly one of 'marketId' or 'polymarketMarketId'");
    }
    
    const queryParams: Record<string, any> = { ...params };
    return apiClient.get<MarketResponse>(API_ENDPOINTS.market, queryParams);
  }
};
