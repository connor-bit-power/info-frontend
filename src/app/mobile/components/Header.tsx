'use client';

import { useEffect, useState } from 'react';

interface HeaderProps {
  scrollProgress?: number; // 0 = not scrolled, 1 = fully scrolled
}

export default function Header({ scrollProgress = 0 }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  // Smooth easing function for animations
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedProgress = easeOutCubic(Math.min(scrollProgress, 1));

  // Calculate animated values
  const gifSize = 200 - (easedProgress * 100); // 200px -> 100px
  const gifMarginBottom = 4 - (easedProgress * 4); // 4px -> 0px

  return (
    <div className="w-full transition-all duration-300 ease-out">
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
            marginTop: '-6px',
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

      {/* Date Display */}
      <h3 
        className="text-white text-xl font-medium text-center mb-4"
        style={{ fontFamily: "'SF Pro Rounded', sans-serif" }}
      >
        {currentDate}
      </h3>
    </div>
  );
}
