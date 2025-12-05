'use client';

import { useRef, useEffect, useState } from 'react';
import type { FeedItem } from '@/types/news-api';

interface NewsFeedProps {
  headlines: FeedItem[];
  onHeadlineClick: (headline: FeedItem, index: number) => void;
  onScroll?: (scrollProgress: number) => void;
  loading?: boolean;
}

export default function NewsFeed({ headlines, onHeadlineClick, onScroll, loading }: NewsFeedProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !onScroll) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      // Normalize scroll to 0-1 range, reaching 1 at 100px scroll
      const progress = Math.min(scrollTop / 100, 1);
      setScrollProgress(progress);
      onScroll(progress);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  return (
    <>
      {/* Top gradient mask overlay - fades in as user scrolls */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-300"
        style={{
          height: '120px',
          background: 'linear-gradient(to bottom, #242424 0%, transparent 100%)',
          opacity: scrollProgress >= 0.3 ? 1 : 0,
          zIndex: 10,
        }}
      />


      <div
        ref={scrollContainerRef}
        className="overflow-y-auto flex-1"
        style={{
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '20px',
          paddingBottom: '40px',
          maskImage: "linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 80px), transparent 100%)",
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            <img src="/white.gif" alt="Loading..." className="w-8 h-8 opacity-50" />
          </div>
        ) : (
          headlines.map((headline, index) => {
            // Determine dot color based on feed type
            const getDotColor = () => {
              if (headline.feedType === 'alert_price_movement') {
                // Green for up, red for down
                return headline.alertData && headline.alertData.priceTo > headline.alertData.priceFrom
                  ? '#34C759' // Green
                  : '#FF3B30'; // Red
              }
              if (headline.feedType === 'alert_new_market') {
                return '#007AFF'; // Blue for new markets
              }
              // Orange for regular news headlines
              return '#FF9500';
            };

            return (
              <div
                key={headline.id}
                className="text-[#E0E0E0] cursor-pointer hover:opacity-70 transition-opacity flex flex-row items-start gap-3"
                style={{
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  fontSize: '21px',
                  fontWeight: 'normal',
                  lineHeight: '25px',
                  marginBottom: '21px'
                }}
                onClick={() => onHeadlineClick(headline, index)}
              >
                <div
                  style={{
                    minWidth: '6px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getDotColor(),
                    marginTop: '10px',
                    flexShrink: 0,
                  }}
                />
                <span className="flex-1">
                  {headline.title}
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
