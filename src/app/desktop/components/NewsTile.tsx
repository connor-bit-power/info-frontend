'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Tile from './Tile';
import headlinesData from './Headlines.json';
import { InfoCircleIcon } from '../../components/icons/InfoCircleIcon';

interface NewsTileProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDarkMode?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, handle: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
}

export default function NewsTile({
  id,
  x,
  y,
  width,
  height,
  isDarkMode,
  onMouseDown,
  onResizeStart,
  isDragging,
  isResizing,
}: NewsTileProps) {
  // State to manage visible headlines - start with first 12
  const [headlineCount, setHeadlineCount] = useState(12);
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(12);

  // Track scroll position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsAtTop(scrollTop < 5); // Consider "at top" if within 5px
  };

  // Auto-scroll to top when new headline is added (only if already at top)
  useEffect(() => {
    if (headlineCount > previousCountRef.current && isAtTop && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    previousCountRef.current = headlineCount;
  }, [headlineCount, isAtTop]);

  // Add new headlines every second until we reach 40
  useEffect(() => {
    // Only run if we haven't reached 40 yet
    if (headlineCount >= 40) return;

    const timer = setTimeout(() => {
      setHeadlineCount(prev => Math.min(prev + 1, 40));
    }, 1000);

    return () => clearTimeout(timer);
  }, [headlineCount]);

  // Get the headlines to display (newest first)
  const displayHeadlines = headlinesData.slice(0, headlineCount).reverse();

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
        isDarkMode={isDarkMode}
        onMouseDown={onMouseDown}
        onResizeStart={onResizeStart}
        isDragging={isDragging}
        isResizing={isResizing}
      >
        {/* Tile content */}
        <div className="h-full">
          <div className="flex justify-between items-center" style={{ position: 'absolute', top: '15px', left: '30px', right: '30px' }}>
            <h1 
              className="text-white font-semibold"
              style={{ 
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '28px',
              }}
            >
              Latest News
            </h1>
            <InfoCircleIcon size="md" className="text-white opacity-85" />
          </div>
          
          {/* Headlines list - Scrollable */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto hide-scrollbar"
            style={{ 
              position: 'absolute',
              top: '60px',
              left: '15px',
              right: '30px',
              bottom: '30px',
              paddingLeft: '15px',
              paddingTop: '20px',
              paddingBottom: '40px',
              maskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {displayHeadlines.map((headline, index) => (
              <motion.div
                key={`headline-${headline.id}`}
                initial={index === 0 ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                layout="position"
                transition={{ 
                  opacity: { duration: 0.5 },
                  layout: { 
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }
                }}
                style={{
                  marginTop: index === 0 ? '12px' : '21px',
                  position: 'relative',
                }}
              >
                {/* Category dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-15px',
                    top: '10px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getCategoryColor(headline.category),
                  }}
                />
                <p
                  className="text-white"
                  style={{
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '18px',
                    fontWeight: 400,
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {headline.title}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Tile>
    </>
  );
}

