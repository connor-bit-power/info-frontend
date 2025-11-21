'use client';

import { useRef, useEffect, useState } from 'react';
import type { HeadlineItem } from '@/types/news-api';

interface NewsFeedProps {
  headlines: HeadlineItem[];
  onHeadlineClick: (headline: HeadlineItem, index: number) => void;
  onScroll?: (scrollProgress: number) => void;
}

export default function NewsFeed({ headlines, onHeadlineClick, onScroll }: NewsFeedProps) {
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
      {/* Top gradient mask overlay - only visible when header is fully compacted */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-300"
        style={{
          height: '120px',
          background: 'linear-gradient(to bottom, #181818 0%, transparent 100%)',
          opacity: scrollProgress >= 1 ? 1 : 0,
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
        }}
      >
      {headlines.map((headline, index) => (
        <div
          key={headline.id}
          className="text-white cursor-pointer hover:opacity-70 transition-opacity"
          style={{
            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
            fontSize: '21px',
            fontWeight: 'normal',
            lineHeight: '25px',
            marginBottom: '21px'
          }}
          onClick={() => onHeadlineClick(headline, index)}
        >
          {headline.title}
        </div>
      ))}
      </div>
    </>
  );
}
