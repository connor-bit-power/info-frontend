'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import Chart from '../../../components/Chart';
import Tile from './Tile';
import headlinesData from './ChartHeadlines.json';
import mockChartData from './ChartMockData.json';
import type { MarketHeadlineDetail } from '@/types/news-api';

interface ChartTileProps {
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
  marketId?: string; // Optional market ID to display specific market
  useMockData?: boolean; // Flag to use mock data instead of API
}

interface PriceHistoryData {
  history: Array<{ t: number; p: number }>;
}

// Renamed to match type from news-api but kept as alias for clarity in this file
type Headline = MarketHeadlineDetail;

export default function ChartTile({
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
  marketId = 'trump-agrees-to-sell-f-35-to-saudi-arabia-by-november-30', // Default market
  useMockData = true, // Use mock data by default for now
}: ChartTileProps) {
  const [chartData, setChartData] = useState<PriceHistoryData | null>(null);
  const [marketTitle, setMarketTitle] = useState<string>('Market Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cast mock data to correct type
  const [headlines] = useState<Headline[]>(headlinesData as unknown as Headline[]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);

  // Fetch market data or use mock data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      if (useMockData) {
        // Use mock data
        setChartData(mockChartData as PriceHistoryData);
        setMarketTitle('Market Overview');
        setLoading(false);
        return;
      }

      try {
        // Fetch event data from API
        const eventResponse = await fetch(`http://localhost:3001/api/events/slug/${marketId}`);
        if (!eventResponse.ok) {
          throw new Error('Failed to fetch market data');
        }

        const event = await eventResponse.json();
        setMarketTitle(event.title || 'Market');

        // Get the first market's Yes outcome
        if (event.markets && event.markets.length > 0) {
          const market = event.markets[0];
          const clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
          const outcomes = JSON.parse(market.outcomes || '[]');

          // Find Yes index
          const yesIndex = outcomes.findIndex((o: string) => /^yes$/i.test(o.trim()));

          if (yesIndex >= 0 && clobTokenIds[yesIndex]) {
            // Fetch price history
            const priceResponse = await fetch(
              `http://localhost:3001/api/prices-history?market=${clobTokenIds[yesIndex]}&interval=max&fidelity=60`
            );

            if (priceResponse.ok) {
              const data = await priceResponse.json();
              setChartData(data);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [marketId, useMockData]);

  // Static set of headlines - sorted by date descending (newest first)
  const displayHeadlines = [...headlines].sort((a, b) => {
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
        <div className="h-full" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Chart Section - 60% */}
          <div
            ref={chartContainerRef}
            style={{
              height: '60%',
              position: 'relative',
              flexShrink: 0, // Prevent flex shrinking
            }}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            <Chart
              data={chartData}
              title={marketTitle}
              outcome="Yes"
              height={(height * 0.6) - 40}
              loading={loading}
              error={error}
            />
          </div>

          {/* Headlines Section - 40% */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto hide-scrollbar"
            style={{
              height: '40%',
              flexShrink: 0,
              position: 'relative', // Ensure offsetTop is relative to this container
              paddingLeft: '12px',
              paddingRight: '24px',
              paddingTop: '50px', // Push content down below the mask/fade area
              paddingBottom: '32px',
              // Fade out the top 40px and bottom 60px
              maskImage: 'linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 50px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 50px), transparent 100%)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
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
