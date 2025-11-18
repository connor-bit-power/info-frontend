/**
 * Search Service
 * API methods for search endpoint
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { SearchResult, SearchQueryParams } from '@/types/polymarket';

export class SearchService {
  /**
   * Search markets, events, tags, and profiles
   */
  async search(params: SearchQueryParams): Promise<SearchResult> {
    if (!params.q) {
      throw new Error('Search query "q" is required');
    }
    return apiClient.get<SearchResult>(API_ENDPOINTS.search, params);
  }

  /**
   * Search with default parameters
   */
  async quickSearch(
    query: string,
    limitPerType: number = 10
  ): Promise<SearchResult> {
    return this.search({
      q: query,
      limit_per_type: limitPerType,
      search_tags: true,
      search_profiles: false,
    });
  }

  /**
   * Search events only
   */
  async searchEvents(query: string, limit: number = 20): Promise<SearchResult> {
    return this.search({
      q: query,
      limit_per_type: limit,
      search_tags: false,
      search_profiles: false,
    });
  }

  /**
   * Search with tag filtering
   */
  async searchByTag(
    query: string,
    tagId: number,
    limit: number = 10
  ): Promise<SearchResult> {
    return this.search({
      q: query,
      events_tag: [String(tagId)],
      limit_per_type: limit,
    });
  }

  /**
   * Search within a specific category
   */
  async searchInCategory(
    query: string,
    category: string,
    limit: number = 10
  ): Promise<SearchResult> {
    return this.search({
      q: `${query} ${category}`,
      limit_per_type: limit,
      search_tags: true,
    });
  }
}

export const searchService = new SearchService();





