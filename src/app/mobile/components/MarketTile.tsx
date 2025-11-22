'use client';

import { motion } from 'framer-motion';

type MarketVariant = 'yesno' | 'multi';

interface Outcome {
    name: string;
    percent: number;
    color?: 'green' | 'red' | 'gray';
}

interface MarketTileProps {
    variant: MarketVariant;
    title: string;
    volume: string;
    imageColor?: string; // For the placeholder image
    imageUrl?: string; // Image URL from API
    outcomes?: Outcome[]; // For multi variant
    chance?: number; // For yesno variant (main chance)
    yesPrice?: number;
    noPrice?: number;
    isDarkMode?: boolean;
    isMonthly?: boolean; // For the "Monthly" badge in the 3rd example
}

export default function MarketTile({
    variant,
    title,
    volume,
    imageColor = '#2D3748',
    imageUrl,
    outcomes = [],
    chance,
    isDarkMode = true,
    isMonthly = false,
}: MarketTileProps) {

    // Icons as simple SVGs
    const RefreshIcon = () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
    );

    const GiftIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
    );

    const BookmarkIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
    );

    return (
        <div
            style={{
                backgroundColor: 'rgba(217, 217, 217, 0.10)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
            }}
        >
            {/* Top Section: Image + Title + (Optional Chart/Chance) */}
            <div className="flex gap-3 mb-2">
                {/* Image */}
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: imageUrl ? 'transparent' : imageColor,
                        flexShrink: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    <h3
                        style={{
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 500,
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {title}
                    </h3>
                </div>

                {/* Chance Circle (Only for middle example in screenshot) */}
                {variant === 'yesno' && chance !== undefined && (
                    <div className="flex flex-col items-center justify-center shrink-0 ml-1">
                        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                            {/* Simple SVG Circle Progress */}
                            <svg width="44" height="44" viewBox="0 0 44 44">
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#334155" strokeWidth="4" />
                                <circle
                                    cx="22"
                                    cy="22"
                                    r="18"
                                    fill="none"
                                    stroke={chance > 50 ? "#10B981" : "#EF4444"}
                                    strokeWidth="4"
                                    strokeDasharray={`${(chance / 100) * 113} 113`}
                                    transform="rotate(-90 22 22)"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                                {chance}%
                            </div>
                        </div>
                        <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '-2px' }}>chance</span>
                    </div>
                )}
            </div>

            {/* Middle Section: Outcomes */}
            <div className="flex-1 flex flex-col min-h-0 gap-2 mb-3">
                {variant === 'multi' ? (
                    // Multi Outcome Layout
                    <div
                        className="flex flex-col gap-2 overflow-y-auto pr-1"
                        style={{
                            minHeight: '80px',
                            maxHeight: '120px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            maskImage: 'linear-gradient(to bottom, black calc(100% - 20px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 20px), transparent 100%)',
                        }}
                    >
                        <style jsx>{`
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {outcomes.map((outcome, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm shrink-0">
                                <span style={{ color: 'white', fontSize: '13px' }}>{outcome.name}</span>
                                <div className="flex items-center gap-2">
                                    <span style={{ color: 'white', fontWeight: 600 }}>{outcome.percent}%</span>
                                    <div className="flex gap-1">
                                        <div style={{ backgroundColor: '#064E3B', color: '#34D399', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Yes</div>
                                        <div style={{ backgroundColor: '#451A1A', color: '#F87171', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>No</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Yes/No Layout (Large Buttons)
                    <div className="flex gap-2 mt-2">
                        <div
                            className="flex-1 flex items-center justify-center py-2 rounded"
                            style={{ backgroundColor: '#064E3B', color: '#34D399', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                        >
                            Yes
                        </div>
                        <div
                            className="flex-1 flex items-center justify-center py-2 rounded"
                            style={{ backgroundColor: '#451A1A', color: '#F87171', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                        >
                            No
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: Metadata */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{volume} Vol.</span>
                    {isMonthly && (
                        <>
                            <RefreshIcon />
                            <span>Monthly</span>
                        </>
                    )}
                    {!isMonthly && variant === 'yesno' && <RefreshIcon />}
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <GiftIcon />
                    <BookmarkIcon />
                </div>
            </div>
        </div>
    );
}
