import { useState, useEffect } from 'react';
import type { HeadlineItem, AlertItem, FeedItem, FeedItemType } from '@/types/news-api';
import { API_CONFIG } from '@/lib/api/config';

const CACHE_KEY = 'feed_cache_v2'; // Updated to clear old emoji cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData {
    headlines: FeedItem[];
    timestamp: number;
}

// Global in-memory cache to prevent flicker on navigation
let memoryCache: CacheData | null = null;

/**
 * Convert an AlertItem to a FeedItem (headline-like format)
 */
function alertToFeedItem(alert: AlertItem): FeedItem {
    const isNewMarket = alert.type === 'new_market';
    const feedType: FeedItemType = isNewMarket ? 'alert_new_market' : 'alert_price_movement';
    
    // Format the title based on alert type
    let title: string;
    if (isNewMarket) {
        title = `🆕 New Market: ${alert.question}`;
    } else {
        // Price movement - show direction and percentage (no emoji)
        const changePercent = Math.abs(alert.priceChangePercent);
        title = `${changePercent}% move: ${alert.question}`;
    }

    return {
        id: alert.id,
        title,
        slug: alert.marketId,
        url: '',
        source: 'Market Alert',
        published_at: alert.detectedAt,
        created_at: alert.detectedAt,
        updated_at: alert.detectedAt,
        summary: null,
        lead: null,
        tags: [],
        markets: [],
        feedType,
        alertData: {
            marketId: alert.marketId,
            priceFrom: alert.priceFrom,
            priceTo: alert.priceTo,
            priceChange: alert.priceChange,
            priceChangePercent: alert.priceChangePercent,
            volume24hr: alert.volume24hr,
            liquidity: alert.liquidity,
        },
    };
}

/**
 * Convert a HeadlineItem to a FeedItem
 */
function headlineToFeedItem(headline: HeadlineItem): FeedItem {
    return {
        ...headline,
        feedType: 'headline',
    };
}

export function useHeadlines() {
    const [headlines, setHeadlines] = useState<FeedItem[]>(() => {
        // Initialize from memory cache if available and valid
        if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
            return memoryCache.headlines;
        }
        return [];
    });
    const [loading, setLoading] = useState(!memoryCache);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const now = Date.now();

                // Check memory cache first
                if (memoryCache && now - memoryCache.timestamp < CACHE_DURATION) {
                    setHeadlines(memoryCache.headlines);
                    setLoading(false);
                    return;
                }

                // Check local storage cache next (for hard refreshes)
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { headlines: cachedHeadlines, timestamp }: CacheData = JSON.parse(cached);

                    if (now - timestamp < CACHE_DURATION) {
                        memoryCache = { headlines: cachedHeadlines, timestamp };
                        setHeadlines(cachedHeadlines);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch headlines and alerts in parallel
                const [headlinesRes, alertsRes] = await Promise.all([
                    fetch(`${API_CONFIG.baseURL}/api/headlines`),
                    fetch(`${API_CONFIG.baseURL}/api/alerts?limit=50`),
                ]);

                if (!headlinesRes.ok) {
                    throw new Error('Failed to fetch headlines');
                }

                const headlinesData = await headlinesRes.json();
                
                // Convert headlines to feed items
                const headlineFeedItems: FeedItem[] = (headlinesData.headlines || []).map(headlineToFeedItem);

                // Convert alerts to feed items (if alerts fetch succeeded)
                let alertFeedItems: FeedItem[] = [];
                if (alertsRes.ok) {
                    const alertsData = await alertsRes.json();
                    alertFeedItems = (alertsData.items || []).map(alertToFeedItem);
                }

                // Merge and sort by date (newest first)
                const allItems = [...headlineFeedItems, ...alertFeedItems].sort((a, b) => {
                    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
                });

                // Update state and caches
                const newCache = {
                    headlines: allItems,
                    timestamp: Date.now()
                };

                memoryCache = newCache;
                setHeadlines(allItems);
                localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
            } catch (err) {
                console.error('Error fetching feed:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, []);

    return { headlines, loading, error };
}
