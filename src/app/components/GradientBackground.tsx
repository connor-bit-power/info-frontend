'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface GradientBackgroundProps extends React.ComponentProps<'div'> {
  isDarkMode?: boolean;
  transition?: {
    duration?: number;
    ease?: string;
    repeat?: number;
  };
}

export default function GradientBackground({
  isDarkMode = true,
  transition = { duration: 20, ease: 'easeInOut', repeat: Infinity },
  className,
  ...props
}: GradientBackgroundProps) {
  const startColor = '#2E5CFF'; // Blue
  const endColor = isDarkMode ? '#181818' : '#E9DFE5'; // Dark or Light

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className || ''}`}
      {...props}
    >
      <motion.div
        className="absolute inset-0"
        key={isDarkMode ? 'dark' : 'light'}
        initial={{
          background: `radial-gradient(ellipse 120% 100% at 50% 5%, ${startColor} 0%, ${endColor} 85%)`,
        }}
        animate={{
          background: [
            `radial-gradient(ellipse 120% 100% at 50% 5%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 40% 10%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 50% 0%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 60% 10%, ${startColor} 0%, ${endColor} 85%)`,
            `radial-gradient(ellipse 120% 100% at 50% 5%, ${startColor} 0%, ${endColor} 85%)`,
          ],
        }}
        transition={transition}
      />
    </div>
  );
}

