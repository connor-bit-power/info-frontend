'use client';

import { useRouter } from 'next/navigation';
import type { MarketSummary } from '@/types/news-api';

interface RelatedMarketProps {
    market: MarketSummary;
}

export default function RelatedMarket({ market }: RelatedMarketProps) {
    const router = useRouter();

    const handleClick = () => {
        // Use slug or polymarket_market_id as the route parameter since the API expects these identifiers
        const marketIdentifier = market.slug || market.polymarket_market_id || market.id;
        router.push(`/mobile/market/${marketIdentifier}`);
    };

    return (
        <div
            onClick={handleClick}
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
                <div
                    style={{
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: 500,
                        lineHeight: '1.3',
                    }}
                >
                    {market.question}
                </div>

                {/* Change Since This News */}
                <div
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        lineHeight: '1.3',
                    }}
                >
                    <span style={{ color: '#34D399' }}>+10%</span>{' '}
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>since this news</span>
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
        </div>
    );
}
