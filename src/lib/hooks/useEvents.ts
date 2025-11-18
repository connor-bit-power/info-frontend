/**
 * useEvents Hook
 * React hooks for fetching event data (RECOMMENDED for markets)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { polymarketApi } from '@/lib/api';
import type { Event, EventQueryParams } from '@/types/polymarket';

export interface UseEventsOptions extends EventQueryParams {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseEventsResult {
  events: Event[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch list of events
 * Events contain markets - this is the recommended way to fetch market data
 */
export function useEvents(options: UseEventsOptions = {}): UseEventsResult {
  const { enabled = true, refetchInterval, ...params } = options;
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.events.getEvents(params);
      setEvents(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchEvents();

    if (refetchInterval) {
      const interval = setInterval(fetchEvents, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEvents, refetchInterval]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}

export interface UseEventOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseEventResult {
  event: Event | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single event by ID
 */
export function useEvent(
  id: string | undefined,
  options: UseEventOptions = {}
): UseEventResult {
  const { enabled = true, refetchInterval } = options;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!enabled || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.events.getEventById(id);
      setEvent(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, id]);

  useEffect(() => {
    fetchEvent();

    if (refetchInterval) {
      const interval = setInterval(fetchEvent, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEvent, refetchInterval]);

  return {
    event,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}

/**
 * Hook to fetch a single event by slug (RECOMMENDED)
 */
export function useEventBySlug(
  slug: string | undefined,
  options: UseEventOptions = {}
): UseEventResult {
  const { enabled = true, refetchInterval } = options;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!enabled || !slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.events.getEventBySlug(slug);
      setEvent(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, slug]);

  useEffect(() => {
    fetchEvent();

    if (refetchInterval) {
      const interval = setInterval(fetchEvent, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEvent, refetchInterval]);

  return {
    event,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}

/**
 * Hook to fetch active events (most efficient for fetching all markets)
 */
export function useActiveEvents(
  options: Omit<UseEventsOptions, 'closed' | 'order' | 'ascending'> = {}
): UseEventsResult {
  return useEvents({
    order: 'id',
    ascending: false,
    closed: false,
    ...options,
  });
}

/**
 * Hook to fetch trending events (by 24hr volume)
 */
export function useTrendingEvents(
  limit: number = 20,
  options: UseEventsOptions = {}
): UseEventsResult {
  return useEvents({
    limit,
    closed: false,
    order: 'volume24hr',
    ascending: false,
    ...options,
  });
}

/**
 * Hook to fetch events by category
 */
export function useEventsByCategory(
  tagId: number | string | undefined,
  options: UseEventsOptions = {}
): UseEventsResult {
  return useEvents({
    tag_id: tagId,
    closed: false,
    ...options,
    enabled: options.enabled !== false && !!tagId,
  });
}

