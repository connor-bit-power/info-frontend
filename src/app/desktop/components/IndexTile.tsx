'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import Chart from '../../../components/Chart';
import Tile from './Tile';
import MarketTile from '../../mobile/components/MarketTile';
import headlinesData from './ChartHeadlines.json';
import mockChartData from './ChartMockData.json';
import type { MarketHeadlineDetail } from '@/types/news-api';

interface IndexTileProps {
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
    title?: string;
    onClose?: () => void;
}

interface PriceHistoryData {
    history: Array<{ t: number; p: number }>;
}

type Headline = MarketHeadlineDetail;

// Hardcoded related markets
const RELATED_MARKETS = [
    {
        id: 'market-1',
        title: 'Will the Fed cut rates in Q1 2025?',
        volume: 1250000,
        image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/fed-rate-cut.png',
        outcome: 'Yes',
        percent: 65
    },
    {
        id: 'market-2',
        title: 'Bitcoin to hit $100k by EOY?',
        volume: 5400000,
        image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/bitcoin-100k.png',
        outcome: 'No',
        percent: 42
    },
    {
        id: 'market-3',
        title: 'US GDP growth > 2% in 2024?',
        volume: 890000,
        image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/us-gdp.png',
        outcome: 'Yes',
        percent: 78
    },
    {
        id: 'market-4',
        title: 'Oil price > $90/barrel in Dec?',
        volume: 2100000,
        image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/oil-price.png',
        outcome: 'No',
        percent: 30
    }
];

export default function IndexTile({
    id,
    x,
    y,
    width,
    height,
    minWidth,
    maxWidth,
    isDarkMode = true,
    onMouseDown,
    onResizeStart,
    isDragging,
    isResizing,
    title = 'Index Overview',
    onClose
}: IndexTileProps) {
    const [chartData, setChartData] = useState<PriceHistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [headlines] = useState<Headline[]>(headlinesData as unknown as Headline[]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);

    // Load mock data
    useEffect(() => {
        setChartData(mockChartData as PriceHistoryData);
        setLoading(false);
    }, []);

    // Static set of headlines - sorted by date descending (newest first)
    const displayHeadlines = [...headlines].sort((a, b) => {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    // Get date range from chart data
    const getDateRange = () => {
        if (!chartData?.history || chartData.history.length === 0) {
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

        scrollToCorrespondingHeadline(clampedPercentage);
    };

    const handleChartMouseLeave = () => {
        setFocusedHeadlineDate(null);
    };

    const scrollToCorrespondingHeadline = (percentage: number) => {
        if (!scrollContainerRef.current) return;

        const { startDate, endDate } = getDateRange();
        const timeRange = endDate.getTime() - startDate.getTime();
        const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
        const hoveredDateStr = new Date(hoveredTimestamp).toISOString().split('T')[0];

        let targetIndex = -1;
        let closestDiff = Infinity;

        for (let i = 0; i < displayHeadlines.length; i++) {
            const headlineDate = new Date(displayHeadlines[i].published_at);
            const hoverDate = new Date(hoveredDateStr);
            const diff = Math.abs(headlineDate.getTime() - hoverDate.getTime());

            if (diff < closestDiff) {
                closestDiff = diff;
                targetIndex = i;
            }
        }

        if (targetIndex >= 0) {
            const targetHeadline = displayHeadlines[targetIndex];
            if (targetHeadline.published_at !== focusedHeadlineDate) {
                setFocusedHeadlineDate(targetHeadline.published_at);
                const headlineElements = scrollContainerRef.current.children;
                if (headlineElements[targetIndex]) {
                    const element = headlineElements[targetIndex] as HTMLElement;
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
        if (sentimentLower === 'bullish') return '#00FF00';
        if (sentimentLower === 'bearish') return '#FF0000';
        if (sentimentLower === 'neutral') return '#2E5CFF';
        return '#FF0000';
    };

    return (
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
            <div className="flex h-full w-full">
                {/* Left Column: Chart and Newsfeed */}
                <div className="flex-1 flex flex-col h-full border-r border-[rgba(255,255,255,0.1)]">
                    <div className="p-6 pb-2">
                        <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'SF Pro Rounded' }}>
                            {title}
                        </h2>
                    </div>

                    {/* Chart Section - 55% */}
                    <div
                        ref={chartContainerRef}
                        style={{ height: '55%', position: 'relative' }}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={handleChartMouseLeave}
                    >
                        <Chart
                            data={chartData}
                            title=""
                            outcome="Yes"
                            height={(height * 0.55) - 40}
                            loading={loading}
                            error={null}
                        />
                    </div>

                    {/* Headlines Section - 45% */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto hide-scrollbar flex-1"
                        style={{
                            position: 'relative',
                            padding: '0 24px 32px 24px',
                            maskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 40px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 40px), transparent 100%)',
                        }}
                    >
                        {displayHeadlines.map((headline, index) => (
                            <HeadlineItem
                                key={`headline-${headline.id}`}
                                headline={headline}
                                isFocused={focusedHeadlineDate === headline.published_at}
                                isDarkMode={isDarkMode}
                                getSentimentColor={getSentimentColor}
                                isFirst={index === 0}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Column: Related Markets */}
                <div className="w-[320px] flex flex-col h-full bg-[rgba(0,0,0,0.2)]">
                    <div className="p-6 pb-4">
                        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'SF Pro Rounded' }}>
                            Related Markets
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
                        {RELATED_MARKETS.map((market) => (
                            <div key={market.id} className="h-[100px]">
                                <MarketTile
                                    variant="yesno"
                                    title={market.title}
                                    volume={market.volume.toLocaleString()}
                                    imageUrl={market.image}
                                    chance={market.percent}
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Tile>
    );
}

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
        backgroundColor: isFocused ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0)',
        padding: isFocused ? 12 : 0,
        marginLeft: isFocused ? -12 : 0,
        marginRight: isFocused ? -12 : 0,
        borderRadius: isFocused ? 12 : 0,
        config: { tension: 300, friction: 30 },
    });

    const dotSpring = useSpring({
        left: isFocused ? -4 : -12,
        top: isFocused ? 22 : 10,
        config: { tension: 300, friction: 30 },
    });

    const textSpring = useSpring({
        color: isFocused ? '#FFD700' : (isDarkMode ? '#FFFFFF' : '#181818'),
        fontWeight: isFocused ? 600 : 400,
        config: { tension: 300, friction: 30 },
    });

    return (
        <animated.div
            style={{
                ...springProps,
                marginTop: isFirst ? '12px' : '20px',
                position: 'relative',
            }}
        >
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
                style={{
                    ...textSpring,
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '15px',
                    lineHeight: '1.4',
                    margin: 0,
                }}
            >
                {headline.title}
            </animated.p>
        </animated.div>
    );
}
