'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TileProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderRadius?: string;
  isDarkMode?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, handle: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
  children?: ReactNode;
}

export default function Tile({
  id,
  x,
  y,
  width,
  height,
  backgroundColor = 'rgba(217, 217, 217, 0.1)',
  borderRadius = '20px',
  isDarkMode,
  onMouseDown,
  onResizeStart,
  isDragging,
  isResizing,
  children,
}: TileProps) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={onMouseDown}
      animate={{
        opacity: isDragging || isResizing ? 0.8 : 1,
      }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

