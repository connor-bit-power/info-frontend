'use client';

import { motion, Transition } from 'framer-motion';
import React from 'react';

interface GradientBackgroundProps extends React.ComponentProps<'div'> {
  isDarkMode?: boolean;
  transition?: Transition;
  flipped?: boolean;
  verticalOffset?: number; // Vertical offset in percentage points
}

export default function GradientBackground({
  isDarkMode = true,
  transition = { duration: 20, ease: 'easeInOut', repeat: Infinity },
  flipped = false,
  verticalOffset = 0,
  className,
  ...props
}: GradientBackgroundProps) {
  const startColor = '#181818'; // Dark gray
  const endColor = isDarkMode ? '#000000' : '#E9DFE5'; // Pure black or Light

  // Flip the gradient positions vertically when flipped is true, and apply offset
  const getPosition = (verticalPercent: number) => {
    const basePosition = flipped ? 100 - verticalPercent : verticalPercent;
    return basePosition + verticalOffset;
  };

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className || ''}`}
      {...props}
    >
      <motion.div
        className="absolute inset-0"
        key={`${isDarkMode ? 'dark' : 'light'}-${flipped ? 'flipped' : 'normal'}`}
        initial={{
          background: `radial-gradient(ellipse 120% 100% at 50% ${getPosition(5)}%, ${startColor} 0%, ${endColor} 85%)`,
        }}
        animate={{
          background: [
            `radial-gradient(ellipse 120% 100% at 50% ${getPosition(5)}%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 40% ${getPosition(10)}%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 50% ${getPosition(0)}%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 60% ${getPosition(10)}%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 50% ${getPosition(5)}%, ${startColor} 0%, ${endColor} 85%)`,
          ],
        }}
        transition={transition}
      />
    </div>
  );
}

