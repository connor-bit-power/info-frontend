'use client';

import { ReactNode } from 'react';

interface TileProps {
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  children?: ReactNode;
}

export default function Tile({
  backgroundColor = 'rgba(217, 217, 217, 0.1)',
  borderRadius = '24px',
  padding = '20px',
  children,
}: TileProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor,
        backdropFilter: 'blur(10px)',
        borderRadius: borderRadius,
        padding: padding,
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}

