'use client';

import { useState, useEffect } from 'react';
import ChartMobile from '../../../components/ChartMobile';
import CountingNumber from '../../../app/components/CountingNumber';
import EventHeadlineItem from './EventHeadlineItem';
import type { MarketHeadlineDetail, HeadlineSentiment, MarketResponse } from '@/types/news-api';

interface EventViewProps {
  headline?: string;
  marketId?: string;
  onBack: () => void;
}

interface PriceHistoryData {
  history: Array<{ t: number; p: number }>;
}

export default function EventView({ headline: initialHeadline, marketId, onBack }: EventViewProps) {
  const [chartData, setChartData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<MarketHeadlineDetail[]>([]);
  const [title, setTitle] = useState<string>(initialHeadline || '');
  const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);

  // State for odds display
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!marketId) {
        setError('No market ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8082/api/market?marketId=${encodeURIComponent(marketId)}`);
        if (!response.ok) throw new Error('Failed to fetch market data');

        const data: MarketResponse = await response.json();

        // Set Title
        setTitle(data.market.question);

        // Set Chart Data
        if (data.market.pricing.price_history) {
          const history = data.market.pricing.price_history.map(point => ({
            t: new Date(point.timestamp).getTime() / 1000,
            p: point.yes_price
          }));
          setChartData({ history });

          // Set initial price
          if (history.length > 0) {
            setCurrentPrice(history[history.length - 1].p * 100);
          }
        }

        // Set Headlines
        setHeadlines(data.headlines);

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [marketId]);

  // Static set of headlines - sorted by date descending (newest first)
  const displayHeadlines = [...headlines].sort((a, b) => {
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  // Calculate price change for a headline based on chart data
  const calculatePriceChange = (publishedAt: string): number | null => {
    if (!chartData?.history || chartData.history.length < 2) return null;

    const headlineTime = new Date(publishedAt).getTime() / 1000;
    
    // Find the closest data point before the headline
    let beforePrice: number | null = null;
    let afterPrice: number | null = null;
    
    for (let i = 0; i < chartData.history.length; i++) {
      const point = chartData.history[i];
      
      if (point.t <= headlineTime) {
        beforePrice = point.p;
      }
      
      if (point.t >= headlineTime && afterPrice === null) {
        afterPrice = point.p;
        break;
      }
    }

    // Calculate percentage change (use 24 hours after headline if possible)
    if (beforePrice !== null && afterPrice !== null) {
      const change = ((afterPrice - beforePrice) / beforePrice) * 100;
      return change;
    }

    return null;
  };


  const handleChartHover = (percentage: number | null, date?: Date, price?: number) => {
    if (percentage !== null && date && price !== undefined) {
      // Use the exact price value passed from ChartMobile (already in percentage form 0-100)
      setCurrentPrice(price);

      // Format date for display
      setHoveredDate(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      setHoveredTime(date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));

      // Scroll headlines
      const hoveredDateStr = date.toISOString().split('T')[0];
      scrollToCorrespondingHeadline(hoveredDateStr);
    } else {
      // Reset to latest
      if (chartData?.history && chartData.history.length > 0) {
        setCurrentPrice(chartData.history[chartData.history.length - 1].p * 100);
      }
      setHoveredDate(null);
      setHoveredTime(null);
      setFocusedHeadlineDate(null);
    }
  };

  const scrollToCorrespondingHeadline = (hoveredDateStr: string) => {
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

  // Handle error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-screen bg-[#181818] p-6">
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-2">Unable to Load Market</h2>
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-screen bg-[#181818]">
        <div className="text-white/70 text-sm">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen overflow-y-auto bg-[#181818]" style={{ padding: '16px', paddingBottom: '40px' }}>
      {/* 1. Event Title */}
      <h1 style={{
        fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
        fontSize: '24px',
        fontWeight: 600,
        color: '#FFFFFF',
        margin: '0 0 8px 0',
        lineHeight: '1.2'
      }}>
        {title}
      </h1>

      {/* 2. Odds Display */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        <div style={{
          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
          fontSize: '32px',
          fontWeight: 700,
          color: '#FFFFFF',
        }}>
          {currentPrice !== null ? (
            <>
              <CountingNumber number={currentPrice} decimalPlaces={0} />
              <span style={{ fontSize: '20px', opacity: 0.7 }}>%</span>
            </>
          ) : (
            <span>--<span style={{ fontSize: '20px', opacity: 0.7 }}>%</span></span>
          )}
        </div>

        {/* Date/Time indicator when hovering */}
        <div style={{
          height: '20px',
          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          color: '#FFFFFF',
          opacity: 0.6,
          marginTop: '4px'
        }}>
          {hoveredDate ? (
            <span>{hoveredDate} {hoveredTime && `• ${hoveredTime}`}</span>
          ) : (
            <span>Chance</span>
          )}
        </div>
      </div>

      {/* 3. Chart Line */}
      <div style={{
        width: 'calc(100% + 32px)', // Compensate for padding
        marginBottom: '32px',
        marginLeft: '-16px', // Pull out to edge
        maxWidth: '100vw',
        position: 'relative',
      }}>
        <ChartMobile
          data={chartData}
          title="" // Hidden
          outcome="Yes"
          height={250}
          loading={loading}
          error={error}
          hideOverlay={true}
          onHoverPositionChange={handleChartHover}
        />
      </div>

      {/* 4. News Scroll */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0px'
        }}
      >
        <h2 style={{
          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
          fontSize: '18px',
          fontWeight: 600,
          color: '#FFFFFF',
          marginBottom: '16px',
          opacity: 0.9
        }}>
          Related News
        </h2>

        {displayHeadlines.map((headline, index) => {
          const isFocused = focusedHeadlineDate === headline.published_at;
          const priceChange = calculatePriceChange(headline.published_at);

          return (
            <EventHeadlineItem
              key={`headline-${headline.id}`}
              headline={headline}
              isFocused={isFocused}
              isDarkMode={true}
              getSentimentColor={getSentimentColor}
              isFirst={index === 0}
              priceChange={priceChange}
            />
          );
        })}
      </div>
    </div>
  );
}
