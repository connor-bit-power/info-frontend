'use client';


import { motion } from 'framer-motion';
import Tile from './Tile';
import { useHeadlines } from '@/hooks/useHeadlines';

import { InfoCircleIcon } from '../../components/icons/InfoCircleIcon';
import type { HeadlineItem } from '@/types/news-api';

interface NewsTileProps {
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

export default function NewsTile({
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
}: NewsTileProps) {
  // Use cached headlines hook
  const { headlines } = useHeadlines();

  // Get the headlines to display (newest first)
  const displayHeadlines = headlines;

  // NOTE: HeadlineItem does not have a category field in the new API schema.
  // Removed getCategoryColor and the dot element to match the schema 1:1.

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
        minWidth={minWidth}
        maxWidth={maxWidth}
        isDarkMode={isDarkMode}
        onMouseDown={onMouseDown}
        onResizeStart={onResizeStart}
        isDragging={isDragging}
        isResizing={isResizing}
      >
        {/* Tile content */}
        <div className="h-full">
          <div className="flex justify-between items-center" style={{ position: 'absolute', top: '15px', left: '24px', right: '24px' }}>
            <h1
              className={`${isDarkMode ? 'text-white' : ''} font-semibold`}
              style={{
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '24px',
                color: isDarkMode ? 'white' : '#181818',
              }}
            >
              Latest News
            </h1>
            <InfoCircleIcon size="md" className={`${isDarkMode ? 'text-white' : 'text-[#181818]'} opacity-85`} />
          </div>

          {/* Headlines list - Scrollable */}
          <div
            className="overflow-y-auto hide-scrollbar"
            style={{
              position: 'absolute',
              top: '50px',
              left: '12px',
              right: '24px',
              bottom: '24px',
              paddingLeft: '12px',
              paddingTop: '16px',
              paddingBottom: '32px',
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
                {/* Category dot removed as it's not in schema */}
                <p
                  className={isDarkMode ? 'text-white' : ''}
                  style={{
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                    color: isDarkMode ? 'white' : '#181818',
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
