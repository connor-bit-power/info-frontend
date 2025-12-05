'use client';

import Tile from './Tile';
import MarketTile from './MarketTile';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/lib/api/config';

interface ExplorerTileProps {
    isDarkMode?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export default function ExplorerTile({ isDarkMode = true, className, style }: ExplorerTileProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                const response = await fetch(`${API_CONFIG.baseURL}/api/markets/search?limit=20&active=true&closed=false&sortBy=volume&order=desc&minVolume=1000`);
                const data = await response.json();
                setEvents(data.items || []);
            } catch (error) {
                console.error('Failed to fetch markets:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMarkets();
    }, []);

    // Helper to format volume
    const formatVolume = (vol: number | undefined | null) => {
        if (!vol) return '$0';
        if (vol >= 1000000000) return `$${(vol / 1000000000).toFixed(1)}b`;
        if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}m`;
        if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}k`;
        return `$${vol.toFixed(0)}`;
    };

    // Helper to get image color based on title hash
    const getImageColor = (title: string) => {
        const colors = ['#1E3A8A', '#B91C1C', '#0F172A', '#F59E0B', '#1E40AF', '#4B5563', '#D97706', '#10B981', '#DC2626', '#000000', '#374151', '#991B1B'];
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <Tile
            padding="0px"
            className={className}
            style={style}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: isDarkMode ? 'white' : '#181818',
                            letterSpacing: '-0.02em'
                        }}>
                            Markets
                        </h2>
                    </div>
                </div>

                {/* Scrollable Grid Area */}
                <div
                    className="flex-1 overflow-y-auto min-h-0"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            paddingTop: '20px',
                            paddingBottom: '20px', // Extra padding for scroll
                        }}
                    >
                        {isLoading ? (
                            // Loading Skeletons
                            Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: '100%',
                                        aspectRatio: '1.8',
                                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                        borderRadius: '8px',
                                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                    }}
                                />
                            ))
                        ) : (
                            events.map((market) => {
                                // Map API market data to MarketTile props
                                const volume = market.volume || 0;
                                const title = market.question || market.title || 'Untitled';
                                const image = market.image || market.icon;

                                // Determine if this is a multi-outcome event
                                // The API returns markets, so we check outcomes array
                                let variant: 'yesno' | 'multi' = 'yesno';
                                let outcomes: { name: string; percent: number }[] = [];
                                let chance: number | undefined;

                                try {
                                    const outcomesStr = market.outcomes;
                                    const pricesStr = market.outcomePrices;

                                    const parsedOutcomes = outcomesStr ? JSON.parse(outcomesStr) : [];
                                    const parsedPrices = pricesStr ? JSON.parse(pricesStr) : [];

                                    if (parsedOutcomes.length === 2 && parsedOutcomes[0] === 'Yes' && parsedOutcomes[1] === 'No') {
                                        variant = 'yesno';
                                        chance = Math.round((Number(parsedPrices[0]) || 0) * 100);
                                    } else {
                                        variant = 'multi';
                                        const combined = parsedOutcomes.map((name: string, idx: number) => ({
                                            name,
                                            price: Number(parsedPrices[idx]) || 0
                                        })).sort((a: any, b: any) => b.price - a.price);

                                        outcomes = combined.map((c: any) => ({
                                            name: c.name,
                                            percent: Math.round(c.price * 100)
                                        }));
                                    }
                                } catch (e) {
                                    console.error('Error parsing market data', e);
                                }

                                return (
                                    <motion.div
                                        key={market.id}
                                        style={{
                                            height: '100%',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <MarketTile
                                            variant={variant}
                                            title={title}
                                            volume={formatVolume(volume)}
                                            imageColor={getImageColor(title)}
                                            imageUrl={image}
                                            outcomes={outcomes}
                                            chance={chance}
                                            isDarkMode={isDarkMode}
                                        />
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </Tile>
    );
}
