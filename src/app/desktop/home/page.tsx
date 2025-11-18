'use client';

import { useState, useEffect, useRef } from 'react';
import TopNav, { TopNavRef } from '../components/TopNav';
import GradientBackground from '../../components/GradientBackground';
import ThemeToggler from '../../components/ThemeToggler';
import NewsTile from '../components/NewsTile';
import ChartTile from '../components/ChartTile';
import CalendarTile from '../components/CalendarTile';
import TreemapTile from '../components/TreemapTile';

export default function DesktopHome() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const topNavRef = useRef<TopNavRef>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Listen for "/" key to focus search bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if "/" is pressed and not inside an input/textarea
      if (event.key === '/' && 
          !(event.target instanceof HTMLInputElement) && 
          !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault(); // Prevent "/" from being typed in the search bar
        topNavRef.current?.focusSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update container dimensions
  const [containerWidth, setContainerWidth] = useState(0);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
        setContainerWidth(rect.width);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate tile dimensions dynamically to fit in window
  const GAP = 16;
  const CONTAINER_PADDING = 32; // padding on left and right
  
  // Calculate dimensions based on available space
  // First row has 3 tiles, second row has 1 tile
  const calculateTileDimensions = () => {
    if (containerHeight === 0 || containerWidth === 0) {
      return {
        tallTileWidth: 0,
        tallTileHeight: 0,
        chartTileWidth: 0,
        chartTileHeight: 0,
        calendarTileWidth: 0,
        calendarTileHeight: 0,
        treemapTileWidth: 0,
        treemapTileHeight: 0,
      };
    }

    // Account for container padding (32px on each side = 64px total)
    const availableWidth = containerWidth - (CONTAINER_PADDING * 2);
    const availableHeight = containerHeight;

    // Original aspect ratios
    const tallAspectRatio = 680 / 1250; // width / height
    const chartMultiplier = 1.75;

    // Calculate based on height (95% of container height for tiles)
    let tallTileHeight = Math.floor(availableHeight * 0.95);
    let tallTileWidth = Math.floor(tallTileHeight * tallAspectRatio);
    let chartTileHeight = tallTileHeight;
    let chartTileWidth = Math.floor(tallTileWidth * chartMultiplier);
    let calendarTileHeight = chartTileHeight;
    let calendarTileWidth = chartTileWidth;
    let treemapTileHeight = chartTileHeight;
    let treemapTileWidth = chartTileWidth;

    // Check if first row fits in available width
    const firstRowWidth = tallTileWidth + chartTileWidth + calendarTileWidth + (GAP * 2);
    
    if (firstRowWidth > availableWidth) {
      // Scale down to fit width
      const scaleFactor = availableWidth / firstRowWidth;
      tallTileWidth = Math.floor(tallTileWidth * scaleFactor);
      tallTileHeight = Math.floor(tallTileHeight * scaleFactor);
      chartTileWidth = Math.floor(chartTileWidth * scaleFactor);
      chartTileHeight = Math.floor(chartTileHeight * scaleFactor);
      calendarTileWidth = Math.floor(calendarTileWidth * scaleFactor);
      calendarTileHeight = Math.floor(calendarTileHeight * scaleFactor);
      treemapTileWidth = Math.floor(treemapTileWidth * scaleFactor);
      treemapTileHeight = Math.floor(treemapTileHeight * scaleFactor);
    }

    return {
      tallTileWidth,
      tallTileHeight,
      chartTileWidth,
      chartTileHeight,
      calendarTileWidth,
      calendarTileHeight,
      treemapTileWidth,
      treemapTileHeight,
    };
  };

  const {
    tallTileWidth,
    tallTileHeight,
    chartTileWidth,
    chartTileHeight,
    calendarTileWidth,
    calendarTileHeight,
    treemapTileWidth,
    treemapTileHeight,
  } = calculateTileDimensions();

  return (
    <div className="h-screen w-screen overflow-hidden fixed top-0 left-0">
      <GradientBackground isDarkMode={isDarkMode} />
      <div className="relative z-10 h-full flex flex-col">
        {/* Theme Toggler - Top Right */}
        <div className="absolute top-8 right-8 z-20">
          <ThemeToggler isDarkMode={isDarkMode} onToggle={handleToggle} />
        </div>
        
        <TopNav ref={topNavRef} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        
        {/* Main content area with tiles */}
        <div 
          className="flex-1 pb-8 pt-2 overflow-y-auto" 
          style={{ minHeight: 0, paddingLeft: '32px', paddingRight: '32px' }}
          ref={containerRef}
        >
          {containerHeight > 0 && containerWidth > 0 && tallTileWidth > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
              {/* First Row */}
              <div style={{ display: 'flex', gap: `${GAP}px` }}>
                <div style={{ position: 'relative', width: tallTileWidth, height: tallTileHeight, flexShrink: 0 }}>
                  <NewsTile
                    id="tall-tile"
                    x={0}
                    y={0}
                    width={tallTileWidth}
                    height={tallTileHeight}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div style={{ position: 'relative', width: chartTileWidth, height: chartTileHeight, flexShrink: 0 }}>
                  <ChartTile
                    id="chart-tile"
                    x={0}
                    y={0}
                    width={chartTileWidth}
                    height={chartTileHeight}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div style={{ position: 'relative', width: calendarTileWidth, height: calendarTileHeight, flexShrink: 0 }}>
                  <CalendarTile
                    id="calendar-tile"
                    x={0}
                    y={0}
                    width={calendarTileWidth}
                    height={calendarTileHeight}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              {/* Second Row */}
              <div style={{ display: 'flex', gap: `${GAP}px` }}>
                <div style={{ position: 'relative', width: treemapTileWidth, height: treemapTileHeight, flexShrink: 0 }}>
                  <TreemapTile
                    id="treemap-tile"
                    x={0}
                    y={0}
                    width={treemapTileWidth}
                    height={treemapTileHeight}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
