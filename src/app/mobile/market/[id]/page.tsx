'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSpring, animated } from '@react-spring/web';
import ChartMobile from '../../../../components/ChartMobile';
import Tile from '../../components/Tile';
import ChevronLeftIcon from '../../../components/icons/ChevronLeftIcon';
import PlusCircleIcon from '../../../components/icons/PlusCircleIcon';
import CheckmarkCircleFillIcon from '../../../components/icons/CheckmarkCircleFillIcon';
import type { MarketDetail, MarketHeadlineDetail, HeadlineSentiment } from '@/types/news-api';

interface PriceHistoryData {
    history: Array<{ t: number; p: number }>;
}

interface MarketResponse {
    market: MarketDetail;
    headlines: MarketHeadlineDetail[];
    headlinesCursor: string | null;
    headlinesHasMore: boolean;
}

export default function MarketPage() {
    const router = useRouter();
    const params = useParams();
    const marketId = params.id as string;

    const [marketData, setMarketData] = useState<MarketResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [containerHeight, setContainerHeight] = useState(800);
    const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Set container height
    useEffect(() => {
        setContainerHeight(window.innerHeight);
        const handleResize = () => setContainerHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch market data
    useEffect(() => {
        const fetchMarketData = async () => {
            if (!marketId) return;

            setLoading(true);
            setError(null);

            try {
                // The marketId from the URL route can be either a slug or numeric ID
                // Try using it directly first as marketId parameter
                const response = await fetch(`http://localhost:8082/api/market?marketId=${encodeURIComponent(marketId)}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data: MarketResponse = await response.json();
                setMarketData(data);
            } catch (err) {
                console.error('Error fetching market data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchMarketData();
    }, [marketId]);

    // Convert price history to chart format
    const chartData: PriceHistoryData | null = marketData?.market.pricing.price_history
        ? {
            history: marketData.market.pricing.price_history.map(point => ({
                t: new Date(point.timestamp).getTime() / 1000,
                p: point.yes_price
            }))
        }
        : null;

    // Get date range from chart data
    const getDateRange = () => {
        if (!chartData?.history || chartData.history.length === 0) {
            const now = new Date();
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return { startDate: monthAgo, endDate: now };
        }

        const timestamps = chartData.history.map(point => point.t);
        return {
            startDate: new Date(Math.min(...timestamps) * 1000),
            endDate: new Date(Math.max(...timestamps) * 1000),
        };
    };

    // Handle chart interaction
    const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!chartContainerRef.current || !marketData?.headlines.length) return;

        const rect = chartContainerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));

        scrollToCorrespondingHeadline(clampedPercentage);
    };

    const handleChartMouseLeave = () => {
        setFocusedHeadlineDate(null);
    };

    const scrollToCorrespondingHeadline = (percentage: number) => {
        if (!scrollContainerRef.current || !marketData?.headlines) return;

        const { startDate, endDate } = getDateRange();
        const timeRange = endDate.getTime() - startDate.getTime();
        const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
        const hoveredDate = new Date(hoveredTimestamp);
        const hoveredDateStr = hoveredDate.toISOString().split('T')[0];

        let targetIndex = -1;
        let closestDiff = Infinity;

        for (let i = 0; i < marketData.headlines.length; i++) {
            const headlineDate = new Date(marketData.headlines[i].published_at);
            const hoverDate = new Date(hoveredDateStr);
            const diff = Math.abs(headlineDate.getTime() - hoverDate.getTime());

            if (diff < closestDiff) {
                closestDiff = diff;
                targetIndex = i;
            }
        }

        if (targetIndex >= 0) {
            const targetHeadline = marketData.headlines[targetIndex];

            if (targetHeadline.published_at !== focusedHeadlineDate) {
                setFocusedHeadlineDate(targetHeadline.published_at);

                const headlineElements = scrollContainerRef.current.children;
                if (headlineElements[targetIndex]) {
                    const element = headlineElements[targetIndex] as HTMLElement;
                    const scrollTop = element.offsetTop - 30;

                    scrollContainerRef.current.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth',
                    });
                }
            }
        }
    };

    const getSentimentColor = (sentiment: HeadlineSentiment | null): string => {
        switch (sentiment) {
            case 'bullish': return '#00FF00';
            case 'bearish': return '#FF0000';
            case 'neutral': return '#2E5CFF';
            default: return '#808080';
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#181818] flex items-center justify-center">
                <div className="text-white">Loading market data...</div>
            </div>
        );
    }

    if (error || !marketData) {
        return (
            <div className="h-screen bg-[#181818] flex flex-col items-center justify-center p-4">
                <div className="text-red-400 mb-4">Error: {error || 'Market not found'}</div>
                <button
                    onClick={() => router.back()}
                    className="text-white underline"
                >
                    Go back
                </button>
            </div>
        );
    }

    const displayHeadlines = [...marketData.headlines].sort((a, b) => {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return (
        <div className="flex-1 flex flex-col h-full max-h-screen overflow-hidden" style={{ padding: '16px' }}>
            <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

            {/* Header Area */}
            <div style={{
                marginBottom: '12px',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 8px'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ChevronLeftIcon width={24} height={24} />
                </button>

                <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {isFollowing ? (
                        <CheckmarkCircleFillIcon width={24} height={24} />
                    ) : (
                        <PlusCircleIcon width={24} height={24} />
                    )}
                </button>
            </div>

            {/* Main Content Tile */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Tile padding="0px">
                    <div className="h-full w-full flex flex-col relative">
                        {/* Chart Section */}
                        <div
                            ref={chartContainerRef}
                            style={{
                                height: '45%',
                                position: 'relative',
                                flexShrink: 0,
                                marginTop: '0px'
                            }}
                            onMouseMove={handleChartMouseMove}
                            onTouchMove={handleChartMouseMove}
                            onMouseLeave={handleChartMouseLeave}
                            onTouchEnd={handleChartMouseLeave}
                        >
                            <ChartMobile
                                data={chartData}
                                title={marketData.market.question}
                                outcome="Yes"
                                height={containerHeight * 0.45}
                                loading={loading}
                                error={error}
                                titleFontSize="20px"
                                valueFontSize="20px"
                                onHoverPositionChange={(percentage) => {
                                    // Optional: handle hover position if needed
                                }}
                            />
                        </div>

                        {/* Headlines Section */}
                        <div
                            ref={scrollContainerRef}
                            className="overflow-y-auto hide-scrollbar"
                            style={{
                                flex: 1,
                                position: 'relative',
                                paddingLeft: '16px',
                                paddingRight: '16px',
                                paddingTop: '20px',
                                paddingBottom: '20px',
                                maskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 40px), transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 40px), transparent 100%)',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            {displayHeadlines.map((headline, index) => {
                                const isFocused = focusedHeadlineDate === headline.published_at;

                                return (
                                    <HeadlineItemComponent
                                        key={`headline-${headline.id}`}
                                        headline={headline}
                                        isFocused={isFocused}
                                        getSentimentColor={getSentimentColor}
                                        isFirst={index === 0}
                                    />
                                );
                            })}
                            {displayHeadlines.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    No headlines found for this market.
                                </div>
                            )}
                        </div>
                    </div>
                </Tile>
            </div>
        </div>
    );
}

function HeadlineItemComponent({
    headline,
    isFocused,
    getSentimentColor,
    isFirst,
}: {
    headline: MarketHeadlineDetail;
    isFocused: boolean;
    getSentimentColor: (sentiment: HeadlineSentiment | null) => string;
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
        color: isFocused ? '#FFD700' : '#FFFFFF',
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
                className="text-white"
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
