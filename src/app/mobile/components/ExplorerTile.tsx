'use client';

import Tile from './Tile';
import MarketTile from './MarketTile';
import { motion } from 'framer-motion';
import { useEvents } from '../../../lib/hooks/useEvents';

interface ExplorerTileProps {
    isDarkMode?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export default function ExplorerTile({ isDarkMode = true, className, style }: ExplorerTileProps) {
    const { events, isLoading } = useEvents({
        limit: 20,
        order: 'volume',
        ascending: false,
        closed: false,
    });

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
                            Market Explorer
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
                            events.map((event) => {
                                const volume = event.volume || 0;

                                // Determine if this is a multi-outcome event
                                // Multi-outcome events have multiple markets (one per driver/candidate)
                                const isMultiOutcome = event.markets && event.markets.length > 1;

                                let variant: 'yesno' | 'multi' = 'yesno';
                                let outcomes: { name: string; percent: number }[] = [];
                                let chance: number | undefined;

                                if (isMultiOutcome) {
                                    // Multi-outcome: aggregate all markets
                                    variant = 'multi';

                                    outcomes = event.markets!
                                        .map(market => {
                                            // Use groupItemTitle for clean name (e.g., "Max Verstappen" instead of full question)
                                            const name = market.groupItemTitle || market.question || 'Unknown';

                                            // Get probability from outcomePrices[0] (Yes price)
                                            let price = 0;
                                            try {
                                                const pricesStr = market.outcomePrices;
                                                if (pricesStr) {
                                                    const prices = JSON.parse(pricesStr);
                                                    price = Number(prices[0]) || 0;
                                                }
                                            } catch (e) {
                                                console.error('Error parsing prices for market', market.id, e);
                                            }

                                            return {
                                                name,
                                                price,
                                                percent: Math.round(price * 100)
                                            };
                                        })
                                        .filter(o => o.price > 0) // Filter out markets with no price data
                                        .sort((a, b) => b.price - a.price); // Sort by probability descending
                                } else if (event.markets && event.markets.length === 1) {
                                    // Single market: check if it's Yes/No or multi-outcome
                                    const market = event.markets[0];
                                    const outcomesStr = market.outcomes;
                                    const pricesStr = market.outcomePrices;

                                    try {
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
                                }

                                return (
                                    <motion.div
                                        key={event.id}
                                        style={{
                                            height: '100%',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <MarketTile
                                            variant={variant}
                                            title={event.title || 'Untitled'}
                                            volume={formatVolume(volume)}
                                            imageColor={getImageColor(event.title || '')}
                                            imageUrl={event.image || event.icon || undefined}
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
