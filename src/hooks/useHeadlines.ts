import { useState, useEffect } from 'react';
import type { HeadlineItem } from '@/types/news-api';

const CACHE_KEY = 'headlines_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData {
    headlines: HeadlineItem[];
    timestamp: number;
}

// Global in-memory cache to prevent flicker on navigation
let memoryCache: CacheData | null = null;

export function useHeadlines() {
    const [headlines, setHeadlines] = useState<HeadlineItem[]>(() => {
        // Initialize from memory cache if available and valid
        if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
            return memoryCache.headlines;
        }
        return [];
    });
    const [loading, setLoading] = useState(!memoryCache);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchHeadlines = async () => {
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
                        // We can still fetch in background if needed, but for now let's trust cache
                        return;
                    }
                }

                // Fetch from API if cache missing or expired
                const response = await fetch('http://localhost:8082/api/headlines');
                if (!response.ok) {
                    throw new Error('Failed to fetch headlines');
                }
                const data = await response.json();

                // Update state and caches
                const newCache = {
                    headlines: data.headlines,
                    timestamp: Date.now()
                };

                memoryCache = newCache;
                setHeadlines(data.headlines);
                localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
            } catch (err) {
                console.error('Error fetching headlines:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchHeadlines();
    }, []);

    return { headlines, loading, error };
}
