/**
 * Events Service
 * API methods for event-related endpoints (RECOMMENDED for fetching markets)
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Event, EventQueryParams } from '@/types/polymarket';

export class EventsService {
  /**
   * Get list of events with optional filtering
   * Events contain markets - this is the recommended way to fetch market data
   */
  async getEvents(params?: EventQueryParams): Promise<Event[]> {
    return apiClient.get<Event[]>(API_ENDPOINTS.events, params);
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(id: string): Promise<Event> {
    return apiClient.get<Event>(API_ENDPOINTS.eventById(id));
  }

  /**
   * Get a specific event by slug (RECOMMENDED)
   */
  async getEventBySlug(slug: string): Promise<Event> {
    return apiClient.get<Event>(API_ENDPOINTS.eventBySlug(slug));
  }

  /**
   * Get all active events (most efficient for fetching all markets)
   */
  async getActiveEvents(params?: EventQueryParams): Promise<Event[]> {
    return this.getEvents({
      order: 'id',
      ascending: false,
      closed: false,
      ...params,
    });
  }

  /**
   * Get events by tag ID
   */
  async getEventsByTag(
    tagId: number | string,
    params?: Omit<EventQueryParams, 'tag_id'>
  ): Promise<Event[]> {
    return this.getEvents({
      ...params,
      tag_id: tagId,
    });
  }

  /**
   * Get events by category (using tag)
   */
  async getEventsByCategory(
    tagId: number | string,
    limit: number = 20
  ): Promise<Event[]> {
    return this.getEventsByTag(tagId, {
      limit,
      closed: false,
      order: 'volume24hr',
      ascending: false,
    });
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(limit: number = 10): Promise<Event[]> {
    const events = await this.getActiveEvents({ limit: 50 });
    return events.filter(event => event.featured).slice(0, limit);
  }

  /**
   * Get trending events (by 24hr volume)
   */
  async getTrendingEvents(limit: number = 20): Promise<Event[]> {
    return this.getEvents({
      limit,
      closed: false,
      order: 'volume24hr',
      ascending: false,
    });
  }
}

export const eventsService = new EventsService();





