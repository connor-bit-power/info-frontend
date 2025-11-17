'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface ThemeTogglerProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export default function ThemeToggler({ isDarkMode, onToggle }: ThemeTogglerProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-8 h-8 flex items-center justify-center cursor-pointer"
      style={{ background: 'none', border: 'none', padding: 0 }}
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute"
        initial={false}
        animate={{
          scale: isDarkMode ? 0 : 1,
          rotate: isDarkMode ? 180 : 0,
          opacity: isDarkMode ? 0 : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Sun Icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute"
        initial={false}
        animate={{
          scale: isDarkMode ? 1 : 0,
          rotate: isDarkMode ? 0 : -180,
          opacity: isDarkMode ? 1 : 0,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Moon Icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </button>
  );
}

