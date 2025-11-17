'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import NewsTile from './NewsTile';
import ChartTile from './ChartTile';

interface Tile {
  id: string;
  x: number; // position in pixels
  y: number;
  width: number;
  height: number;
  color: string;
  type?: 'tall' | 'chart' | 'regular'; // Add type to distinguish tile components
}

interface DraggableGridProps {
  isDarkMode?: boolean;
}

const GRID_SIZE = 20; // Snap grid size in pixels
const MIN_TILE_SIZE = 100;
const GAP = 16; // Uniform gap between tiles

export default function DraggableGrid({ isDarkMode }: DraggableGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState({ width: 0, height: 0 });
  const [tiles, setTiles] = useState<Tile[]>([]);
  
  const [dragState, setDragState] = useState<{
    tileId: string | null;
    startX: number;
    startY: number;
    initialTileX: number;
    initialTileY: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    tileId: string | null;
    handle: string; // 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's'
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Update container bounds on mount and resize
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerBounds({ width: rect.width, height: rect.height });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Add tall tile and chart tile once container bounds are known
  useEffect(() => {
    if (containerBounds.height > 0) {
      const tallTileHeight = Math.floor(containerBounds.height * 0.95);
      // Aspect ratio is 680:1250 = 0.544:1
      const tallTileWidth = Math.floor(tallTileHeight * (680 / 1250));
      
      // Chart tile - same height, 1.75x width
      const chartTileHeight = tallTileHeight;
      const chartTileWidth = Math.floor(tallTileWidth * 1.75);
      
      setTiles((prev) => {
        const existingTallTile = prev.find(t => t.id === 'tall-tile');
        const existingChartTile = prev.find(t => t.id === 'chart-tile');
        
        const newTiles = [...prev];
        
        // Update or add tall tile
        if (existingTallTile) {
          const index = newTiles.findIndex(t => t.id === 'tall-tile');
          newTiles[index] = { ...existingTallTile, height: tallTileHeight, width: tallTileWidth };
        } else {
          newTiles.push({
            id: 'tall-tile',
            x: 20, // Left aligned with small margin
            y: Math.floor((containerBounds.height - tallTileHeight) / 2), // Vertically centered
            width: tallTileWidth,
            height: tallTileHeight,
            color: 'rgba(217, 217, 217, 0.6)',
            type: 'tall' as const,
          });
        }
        
        // Update or add chart tile (positioned to the right of tall tile)
        const tallTile = newTiles.find(t => t.id === 'tall-tile')!;
        const chartTileX = tallTile.x + tallTile.width + GAP;
        
        if (existingChartTile) {
          const index = newTiles.findIndex(t => t.id === 'chart-tile');
          newTiles[index] = { 
            ...existingChartTile, 
            x: chartTileX,
            y: tallTile.y,
            height: chartTileHeight, 
            width: chartTileWidth 
          };
        } else {
          newTiles.push({
            id: 'chart-tile',
            x: chartTileX,
            y: tallTile.y,
            width: chartTileWidth,
            height: chartTileHeight,
            color: 'rgba(217, 217, 217, 0.6)',
            type: 'chart' as const,
          });
        }
        
        return newTiles;
      });
    }
  }, [containerBounds.height]);

  // Snap to grid helper
  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Check if tile overlaps with others
  const checkOverlap = (tile: Tile, otherTiles: Tile[]) => {
    return otherTiles.some(other => {
      if (other.id === tile.id) return false;
      return !(
        tile.x + tile.width + GAP <= other.x ||
        tile.x >= other.x + other.width + GAP ||
        tile.y + tile.height + GAP <= other.y ||
        tile.y >= other.y + other.height + GAP
      );
    });
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent, tileId: string) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return; // Don't start drag if clicking resize handle
    }

    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    setDragState({
      tileId,
      startX: e.clientX,
      startY: e.clientY,
      initialTileX: tile.x,
      initialTileY: tile.y,
    });
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, tileId: string, handle: string) => {
    e.stopPropagation();
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    setResizeState({
      tileId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: tile.width,
      initialHeight: tile.height,
      initialX: tile.x,
      initialY: tile.y,
    });
  };

  // Handle mouse move (for both drag and resize)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Handle drag
    if (dragState) {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      let newX = dragState.initialTileX + deltaX;
      let newY = dragState.initialTileY + deltaY;

      // Snap to grid
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);

      const tile = tiles.find(t => t.id === dragState.tileId);
      if (!tile) return;

      // Constrain to bounds
      newX = Math.max(0, Math.min(newX, containerBounds.width - tile.width));
      newY = Math.max(0, Math.min(newY, containerBounds.height - tile.height));

      setTiles(prev =>
        prev.map(t =>
          t.id === dragState.tileId ? { ...t, x: newX, y: newY } : t
        )
      );
    }

    // Handle resize
    if (resizeState) {
      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;

      let newWidth = resizeState.initialWidth;
      let newHeight = resizeState.initialHeight;
      let newX = resizeState.initialX;
      let newY = resizeState.initialY;

      // Calculate new dimensions based on handle
      if (resizeState.handle.includes('e')) {
        newWidth = Math.max(MIN_TILE_SIZE, resizeState.initialWidth + deltaX);
      }
      if (resizeState.handle.includes('w')) {
        newWidth = Math.max(MIN_TILE_SIZE, resizeState.initialWidth - deltaX);
        newX = resizeState.initialX + (resizeState.initialWidth - newWidth);
      }
      if (resizeState.handle.includes('s')) {
        newHeight = Math.max(MIN_TILE_SIZE, resizeState.initialHeight + deltaY);
      }
      if (resizeState.handle.includes('n')) {
        newHeight = Math.max(MIN_TILE_SIZE, resizeState.initialHeight - deltaY);
        newY = resizeState.initialY + (resizeState.initialHeight - newHeight);
      }

      // Snap to grid
      newWidth = snapToGrid(newWidth);
      newHeight = snapToGrid(newHeight);
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);

      // Constrain to bounds
      if (newX + newWidth > containerBounds.width) {
        newWidth = containerBounds.width - newX;
      }
      if (newY + newHeight > containerBounds.height) {
        newHeight = containerBounds.height - newY;
      }
      if (newX < 0) {
        newWidth += newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight += newY;
        newY = 0;
      }

      setTiles(prev =>
        prev.map(t =>
          t.id === resizeState.tileId
            ? { ...t, x: newX, y: newY, width: newWidth, height: newHeight }
            : t
        )
      );
    }
  }, [dragState, resizeState, tiles, containerBounds]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (dragState || resizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, resizeState, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: dragState ? 'grabbing' : 'default',
      }}
    >
      {tiles.map(tile => {
        // Render NewsTile component for tall type
        if (tile.type === 'tall') {
          return (
            <NewsTile
              key={tile.id}
              id={tile.id}
              x={tile.x}
              y={tile.y}
              width={tile.width}
              height={tile.height}
              isDarkMode={isDarkMode}
              // Drag and drop disabled for now
              // onMouseDown={(e) => handleMouseDown(e, tile.id)}
              // onResizeStart={(e, handle) => handleResizeStart(e, tile.id, handle)}
              // isDragging={dragState?.tileId === tile.id}
              // isResizing={resizeState?.tileId === tile.id}
            />
          );
        }

        // Render ChartTile component for chart type
        if (tile.type === 'chart') {
          return (
            <ChartTile
              key={tile.id}
              id={tile.id}
              x={tile.x}
              y={tile.y}
              width={tile.width}
              height={tile.height}
              isDarkMode={isDarkMode}
              // Drag and drop disabled for now
              // onMouseDown={(e) => handleMouseDown(e, tile.id)}
              // onResizeStart={(e, handle) => handleResizeStart(e, tile.id, handle)}
              // isDragging={dragState?.tileId === tile.id}
              // isResizing={resizeState?.tileId === tile.id}
            />
          );
        }

        // Render regular tile
        return (
          <motion.div
            key={tile.id}
            className="absolute"
            style={{
              left: tile.x,
              top: tile.y,
              width: tile.width,
              height: tile.height,
              backgroundColor: tile.color,
              borderRadius: '12px',
              boxShadow: isDarkMode 
                ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: dragState?.tileId === tile.id ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, tile.id)}
            animate={{
              opacity: dragState?.tileId === tile.id || resizeState?.tileId === tile.id ? 0.8 : 1,
            }}
            transition={{ duration: 0.1 }}
          >
            {/* Tile content */}
            <div className="p-4 h-full flex items-center justify-center">
              <span className="text-white text-lg font-semibold" style={{ fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif' }}>
                Tile {tile.id}
              </span>
            </div>

            {/* Resize handles */}
            {/* Corner handles */}
            <div
              className="resize-handle absolute"
              style={{
                bottom: -4,
                right: -4,
                width: 16,
                height: 16,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'se')}
            />
            <div
              className="resize-handle absolute"
              style={{
                bottom: -4,
                left: -4,
                width: 16,
                height: 16,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: '50%',
                cursor: 'nesw-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'sw')}
            />
            <div
              className="resize-handle absolute"
              style={{
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: '50%',
                cursor: 'nesw-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'ne')}
            />
            <div
              className="resize-handle absolute"
              style={{
                top: -4,
                left: -4,
                width: 16,
                height: 16,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'nw')}
            />

            {/* Edge handles */}
            <div
              className="resize-handle absolute"
              style={{
                top: '50%',
                right: -4,
                width: 8,
                height: 40,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: 4,
                transform: 'translateY(-50%)',
                cursor: 'ew-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'e')}
            />
            <div
              className="resize-handle absolute"
              style={{
                top: '50%',
                left: -4,
                width: 8,
                height: 40,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: 4,
                transform: 'translateY(-50%)',
                cursor: 'ew-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'w')}
            />
            <div
              className="resize-handle absolute"
              style={{
                bottom: -4,
                left: '50%',
                width: 40,
                height: 8,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: 4,
                transform: 'translateX(-50%)',
                cursor: 'ns-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 's')}
            />
            <div
              className="resize-handle absolute"
              style={{
                top: -4,
                left: '50%',
                width: 40,
                height: 8,
                backgroundColor: 'white',
                border: '2px solid ' + tile.color,
                borderRadius: 4,
                transform: 'translateX(-50%)',
                cursor: 'ns-resize',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleResizeStart(e, tile.id, 'n')}
            />
          </motion.div>
        );
      })}

      {/* Grid overlay (optional - for visualization) */}
      {(dragState || resizeState) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />
      )}
    </div>
  );
}


