'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import Chart from '../../../components/Chart';
import PillButton from '../../components/PillButton';
import { motion } from 'framer-motion';
import Tile from './Tile';
import headlinesData from './ChartHeadlines.json';
import mockChartData from './ChartMockData.json';
import type { MarketHeadlineDetail } from '@/types/news-api';

interface ProfileTileProps {
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
}

interface PriceHistoryData {
    history: Array<{ t: number; p: number }>;
}

// Renamed to match type from news-api but kept as alias for clarity in this file
type Headline = MarketHeadlineDetail;

const FilterIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18.2988 17.9385" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.9297 8.96484C17.9297 13.9043 13.9131 17.9297 8.96484 17.9297C4.02539 17.9297 0 13.9043 0 8.96484C0 4.0166 4.02539 0 8.96484 0C13.9131 0 17.9297 4.0166 17.9297 8.96484ZM6.78516 11.8916C6.38086 11.8916 6.09961 12.1465 6.09961 12.5244C6.09961 12.9111 6.38086 13.1748 6.78516 13.1748L11.1709 13.1748C11.5752 13.1748 11.8652 12.9111 11.8652 12.5244C11.8652 12.1465 11.5752 11.8916 11.1709 11.8916ZM5.3877 8.87695C4.97461 8.87695 4.69336 9.13184 4.69336 9.51855C4.69336 9.91406 4.97461 10.1689 5.3877 10.1689L12.5771 10.1689C12.9814 10.1689 13.2627 9.91406 13.2627 9.51855C13.2627 9.13184 12.9814 8.87695 12.5771 8.87695ZM4.04297 5.87988C3.63867 5.87988 3.34863 6.13477 3.34863 6.52148C3.34863 6.9082 3.63867 7.16309 4.04297 7.16309L13.9219 7.16309C14.3174 7.16309 14.6162 6.9082 14.6162 6.52148C14.6162 6.13477 14.3174 5.87988 13.9219 5.87988Z" fill="white" fillOpacity="0.85" />
    </svg>
);

export default function ProfileTile({
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
}: ProfileTileProps) {
    const [chartData, setChartData] = useState<PriceHistoryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');

    // Mock data for the chart
    // const [chartData] = useState<PriceHistoryData>(mockChartData as PriceHistoryData);

    // Cast mock data to correct type
    const [headlines] = useState<Headline[]>(headlinesData as unknown as Headline[]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);

    // Load mock data
    useEffect(() => {
        setChartData(mockChartData as PriceHistoryData);
    }, []);

    // Static set of headlines - sorted by date descending (newest first)
    const displayHeadlines = activeTab === 'activity' ? [...headlines].reverse() : [...headlines].sort((a, b) => {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    // Get date range from chart data
    const getDateRange = () => {
        if (!chartData?.history || chartData.history.length === 0) {
            // Fallback to mock data date range
            return {
                startDate: new Date('2024-10-19'),
                endDate: new Date('2024-11-17'),
            };
        }

        const timestamps = chartData.history.map(point => point.t);
        return {
            startDate: new Date(Math.min(...timestamps) * 1000),
            endDate: new Date(Math.max(...timestamps) * 1000),
        };
    };

    // Track mouse position over chart and align headlines
    const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chartContainerRef.current) return;

        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));

        // Scroll to corresponding headline based on date
        scrollToCorrespondingHeadline(clampedPercentage);
    };

    const handleChartMouseLeave = () => {
        // Clear the focused headline
        setFocusedHeadlineDate(null);
    };

    // Scroll to headline matching the hovered date
    const scrollToCorrespondingHeadline = (percentage: number) => {
        if (!scrollContainerRef.current) return;

        // Calculate the date at the hover position
        const { startDate, endDate } = getDateRange();
        const timeRange = endDate.getTime() - startDate.getTime();
        const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
        const hoveredDate = new Date(hoveredTimestamp);

        // Format date to match headline dates (YYYY-MM-DD)
        const hoveredDateStr = hoveredDate.toISOString().split('T')[0];

        // Find the closest headline to this date
        let targetIndex = -1;
        let closestDiff = Infinity;

        for (let i = 0; i < displayHeadlines.length; i++) {
            const headlineDate = new Date(displayHeadlines[i].published_at);
            const hoverDate = new Date(hoveredDateStr);
            const diff = Math.abs(headlineDate.getTime() - hoverDate.getTime());

            // Find the headline with the smallest time difference
            if (diff < closestDiff) {
                closestDiff = diff;
                targetIndex = i;
            }
        }

        // Only update if the focused date actually changed
        if (targetIndex >= 0) {
            const targetHeadline = displayHeadlines[targetIndex];

            // Only update and scroll if we're focusing on a different headline
            if (targetHeadline.published_at !== focusedHeadlineDate) {
                setFocusedHeadlineDate(targetHeadline.published_at);

                const headlineElements = scrollContainerRef.current.children;
                if (headlineElements[targetIndex]) {
                    const element = headlineElements[targetIndex] as HTMLElement;
                    // Scroll to align the element just below the mask/padding area
                    const scrollTop = element.offsetTop - 60;

                    scrollContainerRef.current.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth',
                    });
                }
            }
        }
    };

    const getSentimentColor = (sentiment: string | null): string => {
        if (!sentiment) return '#FF0000';
        const sentimentLower = sentiment.toLowerCase();
        if (sentimentLower === 'bullish') return '#00FF00'; // Green
        if (sentimentLower === 'bearish') return '#FF0000'; // Red
        if (sentimentLower === 'neutral') return '#2E5CFF'; // Blue
        return '#FF0000'; // Default
    };

    return (
        <>
            <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
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
                <div className="h-full" style={{ padding: '0px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                    {/* Header Section */}
                    <div style={{ padding: '16px 24px 12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* PFP Circle */}
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: '#D9D9D9',
                                flexShrink: 0
                            }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <h2 style={{
                                    margin: 0,
                                    color: '#FFFFFF',
                                    fontSize: '24px',
                                    fontWeight: 500,
                                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                    lineHeight: '1.1'
                                }}>
                                    Satoshi
                                </h2>
                                <span style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '14px',
                                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif'
                                }}>
                                    Joined July 2024
                                </span>
                            </div>
                        </div>

                        {/* Top Right Icons */}
                        <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                            <button style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </button>
                            <button style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Value and Date Picker */}
                    <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20, marginTop: '4px' }}>
                        <h1 style={{
                            margin: 0,
                            color: '#FFFFFF',
                            fontSize: '32px',
                            fontWeight: 600,
                            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif'
                        }}>
                            -$12,348.80
                        </h1>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {['1D', '1W', '1M'].map((period) => (
                                <span key={period} style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                    fontWeight: 500
                                }}>
                                    {period}
                                </span>
                            ))}
                            <span style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                color: '#FFFFFF',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                fontWeight: 600
                            }}>
                                ALL
                            </span>
                        </div>
                    </div>

                    {/* Chart Section - Adjusted size and position */}
                    <div
                        ref={chartContainerRef}
                        style={{
                            height: '150px', // Increased slightly per user request
                            position: 'relative',
                            flexShrink: 0,
                            marginTop: '0px',
                            marginBottom: '0px',
                            zIndex: 10,
                        }}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={handleChartMouseLeave}
                    >
                        <Chart
                            data={chartData}
                            outcome="Yes"
                            height={150}
                            loading={loading}
                            hideOverlay={true}
                        />
                    </div>

                    {/* Filter Row */}
                    <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', zIndex: 20 }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <PillButton
                                label="Positions"
                                isSelected={activeTab === 'positions'}
                                onClick={() => setActiveTab('positions')}
                            />
                            <PillButton
                                label="Activity"
                                isSelected={activeTab === 'activity'}
                                onClick={() => setActiveTab('activity')}
                            />
                        </div>
                        <button style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                        }}>
                            <FilterIcon />
                        </button>
                    </div>

                    {/* Headlines Section - Remaining space */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto hide-scrollbar"
                        style={{
                            flex: 1, // Take remaining space
                            position: 'relative', // Ensure offsetTop is relative to this container
                            paddingLeft: '12px',
                            paddingRight: '24px',
                            paddingTop: '20px', // Push content down below the mask/fade area
                            paddingBottom: '20px',
                            // Fade out the top and bottom
                            maskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 40px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 40px), transparent 100%)',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            minHeight: 0, // Allow flex item to shrink below content size
                        }}
                    >
                        {displayHeadlines.map((headline, index) => {
                            const isFocused = focusedHeadlineDate === headline.published_at;

                            return (
                                <HeadlineItem
                                    key={`headline-${headline.id}`}
                                    headline={headline}
                                    isFocused={isFocused}
                                    isDarkMode={isDarkMode}
                                    getSentimentColor={getSentimentColor}
                                    isFirst={index === 0}
                                />
                            );
                        })}
                    </div>
                </div>
            </Tile>
        </>
    );
}

// Separate component for animated headline items
function HeadlineItem({
    headline,
    isFocused,
    isDarkMode,
    getSentimentColor,
    isFirst,
}: {
    headline: Headline;
    isFocused: boolean;
    isDarkMode?: boolean;
    getSentimentColor: (sentiment: string | null) => string;
    isFirst: boolean;
}) {
    const springProps = useSpring({
        backgroundColor: isFocused
            ? 'rgba(255, 215, 0, 0.2)'
            : 'rgba(255, 255, 255, 0)',
        padding: isFocused ? 8 : 0,
        marginLeft: isFocused ? -8 : 0,
        marginRight: isFocused ? -8 : 0,
        borderRadius: isFocused ? 8 : 0,
        config: { tension: 300, friction: 30 },
    });

    const dotSpring = useSpring({
        left: isFocused ? -7 : -15,
        top: isFocused ? 18 : 10,
        config: { tension: 300, friction: 30 },
    });

    const textSpring = useSpring({
        color: isFocused ? '#FFD700' : (isDarkMode ? '#FFFFFF' : '#181818'),
        fontWeight: isFocused ? 600 : 400,
        config: { tension: 300, friction: 30 },
    });

    return (
        <animated.div
            data-headline-id={headline.id}
            data-headline-date={headline.published_at}
            style={{
                ...springProps,
                marginTop: isFirst ? '12px' : '21px',
                position: 'relative',
            }}
        >
            {/* Category dot */}
            <animated.div
                style={{
                    ...dotSpring,
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getSentimentColor(headline.sentiment),
                }}
            />

            <animated.p
                className={isDarkMode ? 'text-white' : ''}
                style={{
                    ...textSpring,
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.3',
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                }}
            >
                {headline.title}
            </animated.p>
        </animated.div>
    );
}
