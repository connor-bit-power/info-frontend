/**
 * useMarkets Hook
 * React hooks for fetching market data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { polymarketApi } from '@/lib/api';
import type { Market, MarketQueryParams } from '@/types/polymarket';

export interface UseMarketsOptions extends MarketQueryParams {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseMarketsResult {
  markets: Market[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch list of markets
 */
export function useMarkets(options: UseMarketsOptions = {}): UseMarketsResult {
  const { enabled = true, refetchInterval, ...params } = options;
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.markets.getMarkets(params);
      setMarkets(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchMarkets();

    if (refetchInterval) {
      const interval = setInterval(fetchMarkets, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarkets, refetchInterval]);

  return {
    markets,
    isLoading,
    error,
    refetch: fetchMarkets,
  };
}

export interface UseMarketOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseMarketResult {
  market: Market | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single market by ID
 */
export function useMarket(
  id: string | undefined,
  options: UseMarketOptions = {}
): UseMarketResult {
  const { enabled = true, refetchInterval } = options;
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarket = useCallback(async () => {
    if (!enabled || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.markets.getMarketById(id);
      setMarket(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, id]);

  useEffect(() => {
    fetchMarket();

    if (refetchInterval) {
      const interval = setInterval(fetchMarket, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarket, refetchInterval]);

  return {
    market,
    isLoading,
    error,
    refetch: fetchMarket,
  };
}

/**
 * Hook to fetch a single market by slug (RECOMMENDED)
 */
export function useMarketBySlug(
  slug: string | undefined,
  options: UseMarketOptions = {}
): UseMarketResult {
  const { enabled = true, refetchInterval } = options;
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarket = useCallback(async () => {
    if (!enabled || !slug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.markets.getMarketBySlug(slug);
      setMarket(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, slug]);

  useEffect(() => {
    fetchMarket();

    if (refetchInterval) {
      const interval = setInterval(fetchMarket, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarket, refetchInterval]);

  return {
    market,
    isLoading,
    error,
    refetch: fetchMarket,
  };
}

/**
 * Hook to fetch active markets
 */
export function useActiveMarkets(
  options: Omit<UseMarketsOptions, 'closed'> = {}
): UseMarketsResult {
  return useMarkets({ ...options, closed: false });
}

/**
 * Hook to fetch top volume markets
 */
export function useTopVolumeMarkets(
  limit: number = 20,
  options: UseMarketsOptions = {}
): UseMarketsResult {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (options.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.markets.getTopVolumeMarkets(limit);
      setMarkets(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, options.enabled]);

  useEffect(() => {
    fetchMarkets();

    if (options.refetchInterval) {
      const interval = setInterval(fetchMarkets, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarkets, options.refetchInterval]);

  return {
    markets,
    isLoading,
    error,
    refetch: fetchMarkets,
  };
}

