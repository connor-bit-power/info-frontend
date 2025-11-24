'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MarketSummary } from '@/types/news-api';

interface RelatedMarketProps {
    market: MarketSummary;
    showTitle?: boolean;
    customTitle?: string;
    publishedAt?: string;
}

export default function RelatedMarket({ market, showTitle = true, customTitle, publishedAt }: RelatedMarketProps) {
    const [fetchedChange, setFetchedChange] = useState<number | null>(null);

    // Use slug or polymarket_market_id as the route parameter since the API expects these identifiers
    const marketIdentifier = (market as any).slug || market.polymarket_market_id || market.id;
    const href = `/mobile/market/${marketIdentifier}`;

    useEffect(() => {
        const fetchPriceAtPub = async () => {
            if (!publishedAt || !market.yes_token_id) return;

            try {
                const pubTimestamp = Math.floor(new Date(publishedAt).getTime() / 1000);
                // Fetch a small window around the publication time (e.g. +/- 1 hour) to be safe,
                // or just use the closest point available.
                // Using Polymarket CLOB API: prices-history?market={token_id}&start={ts}&end={ts}&interval=...
                // We'll fetch 1h history around the pub time.
                const start = pubTimestamp - 3600;
                const end = pubTimestamp + 3600;
                
                const response = await fetch(
                    `https://clob.polymarket.com/prices-history?market=${market.yes_token_id}&start_ts=${start}&end_ts=${end}&interval=1m&fidelity=1`
                );
                
                if (!response.ok) return;
                
                const data = await response.json();
                const history = data.history || [];
                
                if (history.length === 0) return;

                // Find the closest point to pubTimestamp
                let closestPrice = 0;
                let minDiff = Infinity;

                for (const point of history) {
                    const t = point.t; // timestamp in seconds
                    const diff = Math.abs(t - pubTimestamp);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestPrice = Number(point.p); // price
                    }
                }

                if (closestPrice > 0) {
                    const currentPrice = market.pricing.last_price_yes || 0;
                    const change = ((currentPrice - closestPrice) / closestPrice) * 100;
                    setFetchedChange(change);
                }
            } catch (err) {
                console.error('Failed to fetch history', err);
            }
        };

        // Only fetch if we don't have history already provided or if we want to be precise
        // The user request implies "make a request", so we prefer the fetch if token ID is available.
        if (market.yes_token_id && publishedAt) {
            fetchPriceAtPub();
        }
    }, [market.yes_token_id, publishedAt, market.pricing.last_price_yes]);

    return (
        <Link
            href={href}
            style={{
                backgroundColor: 'rgba(217, 217, 217, 0.10)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                textDecoration: 'none', // Ensure no underline from Link
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 217, 217, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 217, 217, 0.10)';
            }}
        >
            {/* Left Content */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {/* Question */}
                {showTitle && (
                    <div
                        style={{
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 500,
                            lineHeight: '1.3',
                        }}
                    >
                        {customTitle || market.question}
                    </div>
                )}

                {/* Change Since This News */}
                <div
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '1.3',
                    }}
                >
                    {(() => {
                        // Use fetched change if available, otherwise fall back to existing logic
                        let changePercent = fetchedChange ?? 0;
                        let hasCalculated = fetchedChange !== null;

                        if (!hasCalculated && publishedAt && market.price_history && market.price_history.length > 0) {
                            const pubDate = new Date(publishedAt).getTime();
                            let priceAtPub = market.price_history[0].yes_price; 

                            for (let i = 0; i < market.price_history.length; i++) {
                                const pointTime = new Date(market.price_history[i].timestamp).getTime();
                                if (pointTime <= pubDate) {
                                    priceAtPub = market.price_history[i].yes_price;
                                } else {
                                    break;
                                }
                            }

                            const currentPrice = market.pricing.last_price_yes || 0;
                            if (priceAtPub > 0) {
                                changePercent = ((currentPrice - priceAtPub) / priceAtPub) * 100;
                                hasCalculated = true;
                            }
                        }

                        const isPositive = changePercent >= 0;
                        const color = isPositive ? '#34D399' : '#EF4444'; // Green or Red
                        const sign = isPositive ? '+' : '';

                        return (
                            <>
                                <span style={{ color }}>{sign}{changePercent.toFixed(0)}%</span>{' '}
                                <span style={{ marginLeft: '2px', color: 'rgba(255, 255, 255, 0.7)' }}> since this news</span>
                            </>
                        );
                    })()}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Vol: ${market.stats.volume_24h?.toLocaleString() ?? '0'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {market.status === 'open' && (
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#34D399',
                                }}
                            />
                        )}
                        <span
                            className={`text-xs capitalize ${market.status === 'open' ? 'text-green-400' : 'text-gray-400'
                                }`}
                        >
                            {market.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Chevron Icon - Vertically Centered */}
            <svg
                width="12"
                height="20"
                viewBox="0 0 4.7373 15.7236"
                style={{ flexShrink: 0, opacity: 0.5 }}
            >
                <path
                    d="M1.66113 15.1084L4.0166 9.11426C4.1748 8.70996 4.36816 8.21777 4.36816 7.83105C4.36816 7.44434 4.1748 6.95215 4.0166 6.54785L1.66113 0.553711C1.5293 0.210938 1.23047 0 0.905273 0C0.386719 0 0 0.37793 0 0.887695C0 1.14258 0.149414 1.49414 0.228516 1.72266L2.87402 8.45508L2.87402 7.20703L0.228516 13.9395C0.149414 14.168 0 14.5107 0 14.7744C0 15.293 0.386719 15.6709 0.905273 15.6709C1.23047 15.6709 1.5293 15.4512 1.66113 15.1084Z"
                    fill="white"
                    fillOpacity="0.85"
                />
            </svg>
        </Link>
    );
}
