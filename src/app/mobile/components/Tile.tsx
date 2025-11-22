'use client';

import { ReactNode } from 'react';

interface TileProps {
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Tile({
  backgroundColor = 'rgba(217, 217, 217, 0.1)',
  borderRadius = '24px',
  padding = '20px',
  children,
  className,
  style,
}: TileProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor,
        backdropFilter: 'blur(10px)',
        borderRadius: borderRadius,
        padding: padding,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

