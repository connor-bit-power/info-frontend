'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import ChartMobile from '../../../components/ChartMobile';
import Tile from './Tile';
import headlinesData from '../../desktop/components/ChartHeadlines.json';
import mockChartData from '../../desktop/components/ChartMockData.json';
import ChevronLeftIcon from '../../components/icons/ChevronLeftIcon';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import CheckmarkCircleFillIcon from '../../components/icons/CheckmarkCircleFillIcon';
import type { MarketHeadlineDetail, HeadlineSentiment } from '@/types/news-api';

interface EventViewProps {
  headline: string;
  onBack: () => void;
}

interface PriceHistoryData {
  history: Array<{ t: number; p: number }>;
}

// Renamed to avoid conflict with the component
type DisplayHeadline = MarketHeadlineDetail;

export default function EventView({ headline, onBack }: EventViewProps) {
  const [chartData, setChartData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cast mock data
  const [headlines] = useState<DisplayHeadline[]>(headlinesData as unknown as DisplayHeadline[]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Mobile-specific state
  const [containerHeight, setContainerHeight] = useState(800); // Default fallback

  useEffect(() => {
    setContainerHeight(window.innerHeight);
    const handleResize = () => setContainerHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use mock data logic from ChartTile
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // Simulate loading mock data
      setChartData(mockChartData as PriceHistoryData);
      setLoading(false);
    };

    loadData();
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

  const handleChartMouseLeave = () => {
    setFocusedHeadlineDate(null);
  };

  const scrollToCorrespondingHeadline = (percentage: number) => {
    if (!scrollContainerRef.current) return;

    const { startDate, endDate } = getDateRange();
    const timeRange = endDate.getTime() - startDate.getTime();
    const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
    const hoveredDate = new Date(hoveredTimestamp);

    const hoveredDateStr = hoveredDate.toISOString().split('T')[0];

    let targetIndex = -1;
    let closestDiff = Infinity;

    for (let i = 0; i < displayHeadlines.length; i++) {
      // Use published_at for date comparison
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
          // Mobile offset: paddingTop (20px) + a bit of buffer
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
      case 'bullish': return '#00FF00'; // Green
      case 'bearish': return '#FF0000'; // Red
      case 'neutral': return '#2E5CFF'; // Blue (using market related color)
      default: return '#808080'; // Grey
    }
  };

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
          onClick={onBack}
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
        <Tile padding="0px"> {/* Remove Tile padding to have full control */}
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
            >
              <ChartMobile
                data={chartData}
                title={headline}
                outcome="Yes"
                height={containerHeight * 0.45}
                loading={loading}
                error={error}
                titleFontSize="20px"
                valueFontSize="20px"
                onHoverPositionChange={(percentage, hoveredDate) => {
                  if (percentage !== null && hoveredDate) {
                    const hoveredDateStr = hoveredDate.toISOString().split('T')[0];
                    scrollToCorrespondingHeadline(percentage);
                  } else {
                    handleChartMouseLeave();
                  }
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
                paddingTop: '20px', // Reduced top padding
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
                    isDarkMode={true}
                    getSentimentColor={getSentimentColor}
                    isFirst={index === 0}
                  />
                );
              })}
            </div>
          </div>
        </Tile>
      </div>
    </div>
  );
}

// Renamed to avoid conflict with exported interface
function HeadlineItemComponent({
  headline,
  isFocused,
  isDarkMode,
  getSentimentColor,
  isFirst,
}: {
  headline: DisplayHeadline;
  isFocused: boolean;
  isDarkMode?: boolean;
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
          fontSize: '16px', // Smaller font for mobile
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
