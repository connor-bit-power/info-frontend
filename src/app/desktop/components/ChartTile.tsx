'use client';

import { useRef, useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import CountingNumber from '../../components/CountingNumber';
import Tile from './Tile';
import chartHeadlinesData from './ChartHeadlines.json';

interface ChartTileProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDarkMode?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, handle: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
}

export default function ChartTile({
  id,
  x,
  y,
  width,
  height,
  isDarkMode,
  onMouseDown,
  onResizeStart,
  isDragging,
  isResizing,
}: ChartTileProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null); // null when not hovering
  const [focusedHeadlineDate, setFocusedHeadlineDate] = useState<string | null>(null);
  const [focusedValue, setFocusedValue] = useState<number | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoverXPosition, setHoverXPosition] = useState<number | null>(null);

  // Track scroll position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Keep for scrolling functionality
  };

  // Track mouse position over chart
  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>, chartDataArray: number[]) => {
    if (chartContainerRef.current) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setHoverPosition(Math.max(0, Math.min(100, percentage)));
      setHoverXPosition(x);
      
      // Calculate the corresponding data point index
      const dataIndex = Math.floor((percentage / 100) * (chartDataArray.length - 1));
      const yValue = chartDataArray[dataIndex];
      setFocusedValue(yValue);
      
      // Calculate and format the hovered date
      const startDate = new Date('2024-10-19');
      const endDate = new Date('2024-11-17');
      const timeRange = endDate.getTime() - startDate.getTime();
      const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
      const hoveredDateObj = new Date(hoveredTimestamp);
      const formattedDate = hoveredDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setHoveredDate(formattedDate);
      
      // Scroll to corresponding headline based on date
      scrollToCorrespondingHeadline(percentage);
    }
  };

  // Scroll to headline matching the hovered date
  const scrollToCorrespondingHeadline = (percentage: number) => {
    if (!scrollContainerRef.current) return;

    // Calculate the date at the hover position
    const startDate = new Date('2024-10-19');
    const endDate = new Date('2024-11-17');
    const timeRange = endDate.getTime() - startDate.getTime();
    const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
    const hoveredDate = new Date(hoveredTimestamp);
    
    // Format date to match headline dates (YYYY-MM-DD)
    const hoveredDateStr = hoveredDate.toISOString().split('T')[0];
    
    // Find the closest headline to this date
    let targetIndex = -1;
    let closestDiff = Infinity;
    
    for (let i = 0; i < displayHeadlines.length; i++) {
      const headlineDate = new Date(displayHeadlines[i].date);
      const hoverDate = new Date(hoveredDateStr);
      const diff = Math.abs(headlineDate.getTime() - hoverDate.getTime());
      
      // Find the headline with the smallest time difference
      // Only update if this is actually closer (strict less than)
      if (diff < closestDiff) {
        closestDiff = diff;
        targetIndex = i;
      }
    }
    
    // Only update if the focused date actually changed
    if (targetIndex >= 0) {
      const targetHeadline = displayHeadlines[targetIndex];
      
      // Only update and scroll if we're focusing on a different headline
      if (targetHeadline.date !== focusedHeadlineDate) {
        setFocusedHeadlineDate(targetHeadline.date);
        
        const headlineElements = scrollContainerRef.current.children;
        if (headlineElements[targetIndex]) {
          const element = headlineElements[targetIndex] as HTMLElement;
          scrollContainerRef.current.scrollTo({
            top: element.offsetTop - 50, // Offset for padding and gradient mask
            behavior: 'smooth',
          });
        }
      }
    }
  };

  // Reset gradient when mouse leaves chart
  const handleChartMouseLeave = (chartDataArray: number[]) => {
    const gradient = document.getElementById('lineGradient');
    if (gradient) {
      // Clear existing stops
      while (gradient.firstChild) {
        gradient.removeChild(gradient.firstChild);
      }

      // Reset to original gradient (0% to 100%)
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.2)');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', 'rgba(255, 255, 255, 1)');

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
    }
    
    // Clear the focused headline
    setFocusedHeadlineDate(null);
    
    // Reset to latest value (rightmost data point)
    setFocusedValue(chartDataArray[chartDataArray.length - 1]);
    
    // Clear hover date, position, and hover state
    setHoveredDate(null);
    setHoverXPosition(null);
    setHoverPosition(null);
  };

  // Update gradient when hover position changes (only when actively hovering)
  useEffect(() => {
    if (hoverPosition === null) return; // Don't update if not hovering
    
    const gradient = document.getElementById('lineGradient');
    if (gradient) {
      // Clear existing stops
      while (gradient.firstChild) {
        gradient.removeChild(gradient.firstChild);
      }

      // Create dramatic focused gradient with tight falloff
      const falloffRange = 5; // Percentage range for the bright spot
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.1)');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', `${Math.max(0, hoverPosition - falloffRange)}%`);
      stop2.setAttribute('stop-color', 'rgba(255, 255, 255, 0.1)');
      
      const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop3.setAttribute('offset', `${hoverPosition}%`);
      stop3.setAttribute('stop-color', 'rgba(255, 255, 255, 1)');
      
      const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop4.setAttribute('offset', `${Math.min(100, hoverPosition + falloffRange)}%`);
      stop4.setAttribute('stop-color', 'rgba(255, 255, 255, 0.1)');
      
      const stop5 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop5.setAttribute('offset', '100%');
      stop5.setAttribute('stop-color', 'rgba(255, 255, 255, 0.1)');

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      gradient.appendChild(stop3);
      gradient.appendChild(stop4);
      gradient.appendChild(stop5);
    }
  }, [hoverPosition]);

  // Generate dates from Oct 19 to Nov 17 (matching ChartHeadlines.json date range - 30 days)
  const generateChartDates = () => {
    const dates = [];
    const startDate = new Date('2024-10-19');
    const endDate = new Date('2024-11-17');
    const numPoints = 100; // Increased data points for smoother visualization
    
    for (let i = 0; i < numPoints; i++) {
      const dayProgress = i / (numPoints - 1);
      const milliseconds = startDate.getTime() + (dayProgress * (endDate.getTime() - startDate.getTime()));
      dates.push(new Date(milliseconds));
    }
    
    return dates;
  };

  const chartDates = generateChartDates();

  // Static chart data - more interesting pattern with trends and volatility
  // All values constrained between 0-100 for y-axis
  const chartData = Array.from({ length: 100 }, (_, i) => {
    // Normalize to 0-1 range first, then scale to 0-100
    const progress = i / 100; // 0 to 1
    
    // Base value that trends upward from ~30 to ~70
    const baseValue = 30 + (progress * 40);
    
    // Combine multiple sine waves for complexity (normalized)
    const mainWave = Math.sin(i / 12) * 12;
    const secondaryWave = Math.sin(i / 6) * 6;
    const tertiaryWave = Math.cos(i / 18) * 4;
    // Add some "noise" variations using fixed pattern
    const noise = Math.sin(i * 2.3) * 2 + Math.cos(i * 1.7) * 1.5;
    
    // Combine all components
    let value = baseValue + mainWave + secondaryWave + tertiaryWave + noise;
    
    // Ensure value stays within 0-100 range
    return Math.max(0, Math.min(100, value));
  });

  // Set initial focused value to latest (rightmost) data point
  useEffect(() => {
    if (focusedValue === null && chartData.length > 0) {
      setFocusedValue(chartData[chartData.length - 1]);
    }
  }, [focusedValue, chartData]);

  // Initialize gradient on mount
  useEffect(() => {
    const gradient = document.getElementById('lineGradient');
    if (gradient && gradient.children.length === 0) {
      // Set initial gradient (0% to 100%)
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.2)');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', 'rgba(255, 255, 255, 1)');

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
    }
  }, []);

  // Static set of headlines - sorted by date descending (newest first)
  const displayHeadlines = [...chartHeadlinesData].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breaking':
        return '#FF0000'; // Red
      case 'new market':
        return '#FFD700'; // Gold/Yellow
      case 'economic':
        return '#00FF00'; // Green
      case 'market related':
        return '#2E5CFF'; // Blue
      default:
        return '#FF0000'; // Default to red
    }
  };

  return (
    <>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .MuiChartsTooltip-root,
        .MuiChartsTooltip-paper,
        .MuiPopper-root[data-popper-placement],
        div[role="tooltip"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
      <Tile
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        isDarkMode={isDarkMode}
        onMouseDown={onMouseDown}
        onResizeStart={onResizeStart}
        isDragging={isDragging}
        isResizing={isResizing}
      >
        {/* Tile content */}
        <div className="h-full">
          <h1 
            className="text-white font-semibold"
            style={{ 
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '28px',
              position: 'absolute',
              top: '15px',
              left: '30px',
            }}
          >
            Market Overview
          </h1>

          {/* Value display in top right */}
          <h1 
            className="text-white font-semibold"
            style={{ 
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '28px',
              position: 'absolute',
              top: '15px',
              right: '30px',
            }}
          >
            {focusedValue !== null ? (
              <CountingNumber 
                number={focusedValue}
              />
            ) : (
              '-- % Chance'
            )}
          </h1>

          {/* Chart area */}
          <div 
            ref={chartContainerRef}
            onMouseMove={(e) => handleChartMouseMove(e, chartData)}
            onMouseLeave={() => handleChartMouseLeave(chartData)}
            className="flex items-center justify-center"
            style={{ 
              position: 'absolute',
              top: '60px',
              left: '0px',
              right: '0px',
              height: '40%',
              overflow: 'hidden',
            }}
          >
            {/* Custom date label at top of hover line */}
            {hoveredDate && hoverXPosition !== null && (
              <div
                style={{
                  position: 'absolute',
                  left: `${hoverXPosition}px`,
                  top: '5px',
                  transform: 'translateX(-50%)',
                  color: '#FFFFFF',
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                {hoveredDate}
              </div>
            )}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(255, 255, 255, 0.2)" />
                  <stop offset="100%" stopColor="rgb(255, 255, 255, 1)" />
                </linearGradient>
              </defs>
            </svg>
            <LineChart
              xAxis={[
                {
                  data: chartDates,
                  scaleType: 'time',
                },
              ]}
              yAxis={[
                {
                  min: 0,
                  max: 100,
                },
              ]}
              series={[
                {
                  data: chartData,
                  color: 'url(#lineGradient)',
                  curve: 'catmullRom',
                  showMark: false,
                },
              ]}
              margin={{ top: 20, right: 30, bottom: 10, left: -90 }}
              disableAxisListener={true}
              sx={{
                width: '100%',
                height: '100%',
                '& .MuiLineElement-root': {
                  stroke: 'url(#lineGradient)',
                  strokeWidth: 4,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                },
                '& .MuiChartsAxis-line': {
                  stroke: 'transparent',
                  strokeWidth: 0,
                  display: 'none',
                },
                '& .MuiChartsAxis-tick': {
                  stroke: 'transparent',
                  strokeWidth: 0,
                  display: 'none',
                },
                '& .MuiChartsAxis-tickLabel': {
                  fill: 'transparent',
                  fontSize: '12px',
                  display: 'none',
                },
                '& .MuiChartsAxisHighlight-root': {
                  stroke: '#FFFFFF',
                  strokeWidth: 1,
                  strokeDasharray: 'none',
                },
                '& .MuiChartsTooltip-root': {
                  display: 'none !important',
                  visibility: 'hidden !important',
                  opacity: '0 !important',
                  pointerEvents: 'none !important',
                },
                '& .MuiChartsTooltip-paper': {
                  display: 'none !important',
                },
                '& .MuiPopper-root': {
                  display: 'none !important',
                },
                '& .MuiChartsTooltip-table': {
                  display: 'none !important',
                },
              }}
              grid={{ horizontal: false, vertical: false }}
            />
          </div>
          
          {/* Headlines scrollview */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto hide-scrollbar"
            style={{ 
              position: 'absolute',
              top: 'calc(10px + 40%)',
              left: '15px',
              right: '30px',
              bottom: '30px',
              paddingLeft: '15px',
              paddingTop: '60px',
              paddingBottom: '40px',
              maskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
              {displayHeadlines.map((headline, index) => {
                const isFocused = focusedHeadlineDate === headline.date;
                return (
                  <div
                    key={`headline-${headline.id}`}
                    data-headline-id={headline.id}
                    data-headline-date={headline.date}
                    style={{
                      marginTop: index === 0 ? '12px' : '21px',
                      position: 'relative',
                      backgroundColor: isFocused ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                      borderRadius: isFocused ? '8px' : '0px',
                      padding: isFocused ? '8px' : '0px',
                      marginLeft: isFocused ? '-8px' : '0px',
                      marginRight: isFocused ? '-8px' : '0px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Category dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: isFocused ? '-7px' : '-15px',
                        top: isFocused ? '18px' : '10px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: getCategoryColor(headline.category),
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <p
                      className="text-white"
                      style={{
                        fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                        fontSize: '18px',
                        fontWeight: isFocused ? 600 : 400,
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        textOverflow: 'ellipsis',
                        color: isFocused ? '#FFD700' : '#FFFFFF',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {headline.title}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </Tile>
    </>
  );
}

