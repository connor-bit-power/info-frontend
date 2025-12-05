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
                padding: '12px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                cursor: 'pointer',
                textDecoration: 'none',
            }}
        >
            {/* Question */}
            {showTitle && (
                <div
                    style={{
                        color: 'white',
                        fontSize: '17px',
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
                    fontSize: '15px',
                    fontWeight: 500,
                    lineHeight: '1.3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
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
                    const color = isPositive ? '#05FF00' : '#FF0000';
                    const Arrow = isPositive ? '↗' : '↘';

                    return (
                        <>
                            <span style={{ color }}>{Arrow} {Math.abs(changePercent).toFixed(0)}%</span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Since this news</span>
                        </>
                    );
                })()}
            </div>
        </Link>
    );
}
