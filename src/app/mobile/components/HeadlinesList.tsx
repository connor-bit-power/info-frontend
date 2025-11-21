'use client';

import { useEffect, useRef, useState } from 'react';

interface Headline {
  id: number;
  title: string;
  category: string;
  date: string;
}

interface HeadlinesListProps {
  headlines: Headline[];
  hoverPercentage: number | null; // 0-100, from chart hover
  hoveredDate: Date | null; // The actual date being hovered on the chart
}

export default function HeadlinesList({ headlines, hoverPercentage, hoveredDate }: HeadlinesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headlineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [highlightedHeadlineId, setHighlightedHeadlineId] = useState<number | null>(null);

  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breaking':
        return '#FF0000'; // Red
      case 'new market':
        return '#FFD700'; // Gold/Yellow
      case 'economic':
        return '#00FF00'; // Green
      case 'market related':
        return '#2E5CFF'; // Blue
      default:
        return '#FF0000'; // Default to red
    }
  };

  // Find the headline that matches the hovered date and snap to it
  useEffect(() => {
    if (hoveredDate && scrollContainerRef.current) {
      // Find the headline closest to this date
      let closestHeadline: Headline | undefined;
      let minDiff = Infinity;
      
      for (const headline of headlines) {
        const headlineDate = new Date(headline.date);
        const diff = Math.abs(headlineDate.getTime() - hoveredDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestHeadline = headline;
        }
      }
      
      if (closestHeadline) {
        const headlineId = closestHeadline.id;
        const headlineElement = headlineRefs.current[headlineId];
        const container = scrollContainerRef.current;
        
        if (headlineElement) {
          // Calculate the position to scroll to (show at top)
          const elementTop = headlineElement.offsetTop;
          container.scrollTo({
            top: elementTop - 40, // Offset for gradient mask
            behavior: 'smooth',
          });
          
          // Highlight this headline
          setHighlightedHeadlineId(headlineId);
        }
      }
    } else {
      // Clear highlight when not hovering
      setHighlightedHeadlineId(null);
    }
  }, [hoveredDate, headlines]);

  return (
    <>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
      
      <div 
        ref={scrollContainerRef}
        className="overflow-y-auto hide-scrollbar"
        style={{ 
          height: '100%',
          paddingLeft: '15px',
          paddingRight: '15px',
          paddingTop: '20px',
          paddingBottom: '20px',
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {headlines.map((headline) => {
          const isHighlighted = highlightedHeadlineId === headline.id;
          
          return (
            <div
              key={headline.id}
              ref={(el) => { headlineRefs.current[headline.id] = el; }}
              style={{
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isHighlighted ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                transition: 'background-color 0.2s ease',
              }}
            >
              {/* Category indicator dot */}
              <div
                style={{
                  minWidth: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getCategoryColor(headline.category),
                  marginTop: '6px',
                }}
              />
              
              {/* Headline text */}
              <div
                style={{
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  fontSize: '16px',
                  fontWeight: isHighlighted ? 600 : 400,
                  lineHeight: '20px',
                  color: '#FFFFFF',
                  transition: 'font-weight 0.2s ease',
                }}
              >
                {headline.title}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

