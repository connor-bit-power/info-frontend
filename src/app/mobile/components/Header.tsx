'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import PillButton from '../../components/PillButton';

// export type TabType = 'Latest' | 'Following' | 'Politics' | 'Crypto' | 'Sports' | 'Business' | 'Science' | 'Tech';

interface HeaderProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  scrollProgress?: number; // 0 = not scrolled, 1 = fully scrolled
  tabs: string[];
}

export default function Header({ selectedTab, onTabChange, scrollProgress = 0, tabs }: HeaderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smooth easing function for animations
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedProgress = easeOutCubic(Math.min(scrollProgress, 1));

  // Calculate animated values
  const gifSize = 200 - (easedProgress * 100); // 200px -> 100px
  const gifMarginBottom = 12 - (easedProgress * 12); // 12px -> 0px (reduced from 24px)
  const pillOpacity = 1 - easedProgress; // 1 -> 0
  const headerPaddingBottom = 10 - (easedProgress * 30); // 10px -> 0px

  return (
    <div
      className="w-full transition-all duration-300 ease-out"
      style={{
        paddingBottom: `${headerPaddingBottom}px`,
      }}
    >
      {/* Animated GIF */}
      <div
        className="flex justify-center transition-all duration-300 ease-out"
        style={{
          marginBottom: `${gifMarginBottom}px`,
        }}
      >
        <img
          src="/white.gif"
          alt="Animation"
          style={{
            width: `${gifSize}px`,
            height: `${gifSize}px`,
            objectFit: 'contain',
            imageRendering: 'auto',
            transform: 'translateZ(0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.33, 1, 0.68, 1), height 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
          }}
        />
      </div>
 {/* Pill Buttons Scroll Container */}
      <div
        className="w-full transition-all duration-300 ease-out overflow-hidden"
        style={{
          opacity: pillOpacity,
          maxHeight: pillOpacity > 0 ? '100px' : '0px',
          pointerEvents: pillOpacity < 0.5 ? 'none' : 'auto',
        }}
      >
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar"
          style={{
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingBottom: '10px', // Add some bottom padding for scrollbar if it appears (though hidden)
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {tabs.map((tab) => (
            <PillButton
              key={tab}
              label={tab}
              isSelected={selectedTab === tab}
              onClick={() => onTabChange(tab)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
