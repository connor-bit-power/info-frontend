'use client';

import { motion } from 'framer-motion';
import Tile from './Tile';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';

interface IndiciesTileProps {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    isDarkMode?: boolean;
    onMouseDown?: (e: React.MouseEvent) => void;
    onResizeStart?: (e: React.MouseEvent, handle: string) => void;
    isDragging?: boolean;
    isResizing?: boolean;
    onIndexClick?: (title: string) => void;
}

interface IndexItem {
    id: string;
    title: string;
    change: number; // Percentage change
    odds: number; // 0-100
}

const INDICES: IndexItem[] = [
    { id: 'us-political', title: 'US Political Power Index', change: 2.4, odds: 75 },
    { id: 'global-political', title: 'Global Political Stability Index', change: -1.2, odds: 45 },
    { id: 'stock-market', title: 'Stock Market Sentiment Index', change: 0.8, odds: 60 },
    { id: 'crypto-market', title: 'Crypto Market Sentiment Index', change: 5.1, odds: 85 },
    { id: 'inflation', title: 'Inflation Forecasting Index', change: -0.5, odds: 30 },
    { id: 'fed-rate', title: 'Fed Rate Forecasting Index', change: 0.2, odds: 55 },
];

export default function IndiciesTile({
    id,
    x,
    y,
    width,
    height,
    minWidth,
    maxWidth,
    isDarkMode,
    onMouseDown,
    onResizeStart,
    isDragging,
    isResizing,
    onIndexClick,
}: IndiciesTileProps) {
    return (
        <>
            <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
            <Tile
                id={id}
                x={x}
                y={y}
                width={width}
                height={height}
                minWidth={minWidth}
                maxWidth={maxWidth}
                isDarkMode={isDarkMode}
                onMouseDown={onMouseDown}
                onResizeStart={onResizeStart}
                isDragging={isDragging}
                isResizing={isResizing}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center" style={{ position: 'absolute', top: '15px', left: '24px', right: '24px' }}>
                        <h1
                            className={`${isDarkMode ? 'text-white' : ''} font-semibold`}
                            style={{
                                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                fontSize: '24px',
                                fontWeight: 600,
                                color: isDarkMode ? 'white' : '#242424',
                            }}
                        >
                            Indicies
                        </h1>
                    </div>

                    {/* List */}
                    <div
                        className="overflow-y-auto hide-scrollbar"
                        style={{
                            position: 'absolute',
                            top: '50px',
                            left: '12px',
                            right: '24px',
                            bottom: '24px',
                            paddingLeft: '12px',
                            paddingTop: '16px',
                            paddingBottom: '32px',
                            maskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {INDICES.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={index === 0 ? { opacity: 0 } : false}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    marginTop: index === 0 ? '12px' : '21px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingRight: '8px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => onIndexClick?.(item.title)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Left Side: Title and Change */}
                                <div className="flex flex-col">
                                    <span
                                        style={{
                                            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: isDarkMode ? 'white' : '#242424',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        {item.title}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                            fontSize: '14px',
                                            fontWeight: 400,
                                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(24, 24, 24, 0.7)',
                                        }}
                                    >
                                        {item.change > 0 ? '+' : ''}{item.change}% change today
                                    </span>
                                </div>

                                {/* Right Side: Odds Arc and Chevron */}
                                <div className="flex items-center gap-3">
                                    {/* Odds Arc */}
                                    {/* Odds Arc */}
                                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                        <svg width="40" height="40" viewBox="0 0 44 44">
                                            {/* Background Arc (270 degrees) */}
                                            <circle
                                                cx="22"
                                                cy="22"
                                                r="18"
                                                fill="none"
                                                stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                                                strokeWidth="4"
                                                strokeDasharray="85 113"
                                                transform="rotate(135 22 22)"
                                                strokeLinecap="round"
                                            />
                                            {/* Progress Arc */}
                                            <circle
                                                cx="22"
                                                cy="22"
                                                r="18"
                                                fill="none"
                                                stroke={item.odds > 50 ? "#10B981" : "#EF4444"}
                                                strokeWidth="4"
                                                strokeDasharray={`${(item.odds / 100) * 85} 113`}
                                                transform="rotate(135 22 22)"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div
                                            className="absolute inset-0 flex items-center justify-center font-bold"
                                            style={{
                                                color: isDarkMode ? 'white' : '#242424',
                                                fontSize: '14px', // Increased from text-xs (12px)
                                            }}
                                        >
                                            {item.odds}
                                        </div>
                                    </div>

                                    {/* Chevron */}
                                    <ChevronRightIcon
                                        size="sm"
                                        className={isDarkMode ? 'text-white' : 'text-[#242424]'}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Tile>
        </>
    );
}
