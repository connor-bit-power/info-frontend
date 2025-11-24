'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import CountingNumber from '../app/components/CountingNumber';

interface PriceHistoryPoint {
  t: number; // Unix timestamp
  p: number; // Price (0.0 to 1.0)
}

interface PriceHistoryData {
  history: PriceHistoryPoint[];
}

interface SeriesData {
  label: string;
  data: PriceHistoryData | null;
  color?: string;
}

interface ChartMobileProps {
  data?: PriceHistoryData | null;
  series?: SeriesData[];
  title?: string;
  outcome?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  onHoverPositionChange?: (percentage: number | null, hoveredDate?: Date, hoveredPrice?: number) => void;
  titleFontSize?: string;
  valueFontSize?: string;
  hideOverlay?: boolean;
}

type Timeframe = '1D' | '1W' | '1M' | 'ALL';

export default function ChartMobile({
  data,
  series,
  title = 'Market Odds Over Time',
  outcome = 'Yes',
  height = 400,
  loading = false,
  error = null,
  onHoverPositionChange,
  titleFontSize = '20px',
  valueFontSize = '20px',
  hideOverlay = false,
}: ChartMobileProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [focusedValues, setFocusedValues] = useState<{ [key: string]: number }>({});
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [hoverXPosition, setHoverXPosition] = useState<number | null>(null);
  const [hoverYPositions, setHoverYPositions] = useState<{ [key: string]: number }>({});
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isTouching, setIsTouching] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('ALL');
  
  // Track initial touch position to detect scroll vs chart interaction
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isScrolling = useRef<boolean>(false);

  // Determine if we're using single data prop or series prop
  const seriesData = series || (data ? [{ label: outcome, data }] : []);

  // Color palette for multi-outcome charts
  const colors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
  ];

  // Filter data based on selected timeframe
  const filterDataByTimeframe = (history: PriceHistoryPoint[]): PriceHistoryPoint[] => {
    if (selectedTimeframe === 'ALL' || history.length === 0) {
      return history;
    }

    const now = Date.now() / 1000; // Current time in Unix timestamp
    let cutoffTime = 0;

    switch (selectedTimeframe) {
      case '1D':
        cutoffTime = now - (24 * 60 * 60); // 1 day
        break;
      case '1W':
        cutoffTime = now - (7 * 24 * 60 * 60); // 1 week
        break;
      case '1M':
        cutoffTime = now - (30 * 24 * 60 * 60); // 30 days
        break;
    }

    return history.filter(point => point.t >= cutoffTime);
  };

  // Transform data for MUI X Charts
  let xAxisData: Date[] = [];
  const yAxisDatasets: { label: string; data: number[]; color?: string }[] = [];

  if (seriesData.length > 0 && seriesData[0].data?.history) {
    const filteredHistory = filterDataByTimeframe(seriesData[0].data.history);
    xAxisData = filteredHistory.map((point) => new Date(point.t * 1000));

    seriesData.forEach((s, index) => {
      if (s.data?.history) {
        const filteredSeriesHistory = filterDataByTimeframe(s.data.history);
        const yData = filteredSeriesHistory.map((point) => point.p * 100);
        yAxisDatasets.push({
          label: s.label,
          data: yData,
          color: s.color || (seriesData.length > 1 ? colors[index % colors.length] : undefined),
        });
      }
    });
  }

  // Calculate dynamic Y-axis range based on data
  let yMin = 0;
  let yMax = 100;
  
  if (yAxisDatasets.length > 0) {
    const allValues = yAxisDatasets.flatMap(dataset => dataset.data);
    if (allValues.length > 0) {
      const dataMin = Math.min(...allValues);
      const dataMax = Math.max(...allValues);
      
      // Add 5% padding above and below for better visualization
      const range = dataMax - dataMin;
      const padding = range * 0.1;
      
      yMin = Math.max(0, dataMin - padding);
      yMax = Math.min(100, dataMax + padding);
      
      // Ensure minimum range of 5% for very flat data
      if (yMax - yMin < 5) {
        const center = (yMax + yMin) / 2;
        yMin = Math.max(0, center - 2.5);
        yMax = Math.min(100, center + 2.5);
      }
    }
  }

  // Track container width for responsive title sizing
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Set initial focused values to latest data points
  useEffect(() => {
    if (yAxisDatasets.length > 0) {
      const initialValues: { [key: string]: number } = {};
      yAxisDatasets.forEach((dataset) => {
        if (dataset.data.length > 0) {
          initialValues[dataset.label] = dataset.data[dataset.data.length - 1];
        }
      });
      setFocusedValues(initialValues);
    } else {
      setFocusedValues({});
    }
  }, [data, series, outcome, yAxisDatasets.length]);

  // Handle continuous touch/mouse tracking
  const updatePosition = (clientX: number) => {
    if (chartContainerRef.current && xAxisData.length > 0) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;

      // Account for the chart's left margin (-50px) and right margin (0px)
      const leftMargin = -50;
      const rightMargin = 0;
      const chartWidth = rect.width;
      const plotWidth = chartWidth - leftMargin - rightMargin;
      
      // Adjust x position to account for left margin
      const xInPlot = x - leftMargin;
      
      // Calculate percentage based on the actual plot area
      const percentage = Math.max(0, Math.min(100, (xInPlot / plotWidth) * 100));

      // Calculate the corresponding data point index and values
      const dataIndex = Math.floor((percentage / 100) * (yAxisDatasets[0]?.data.length - 1 || 0));
      
      // Calculate the actual X position based on the data index (not the mouse position)
      // This ensures the line/dot align exactly with the data point
      const actualPercentage = dataIndex / Math.max(1, (yAxisDatasets[0]?.data.length - 1 || 1));
      const actualXInPlot = actualPercentage * plotWidth;
      const actualX = actualXInPlot + leftMargin;
      setHoverXPosition(actualX);
      
      const newFocusedValues: { [key: string]: number } = {};
      const newYPositions: { [key: string]: number } = {};
      
      // Calculate Y positions for dots
      // Chart height minus margins (top + bottom)
      const chartHeight = height;
      const topMargin = hideOverlay ? 10 : 60;
      const bottomMargin = 10;
      const plotHeight = chartHeight - topMargin - bottomMargin;
      
      // Calculate dynamic Y range for current data
      const allValues = yAxisDatasets.flatMap(d => d.data);
      let localYMin = 0;
      let localYMax = 100;
      
      if (allValues.length > 0) {
        const dataMin = Math.min(...allValues);
        const dataMax = Math.max(...allValues);
        const range = dataMax - dataMin;
        const padding = range * 0.1;
        
        localYMin = Math.max(0, dataMin - padding);
        localYMax = Math.min(100, dataMax + padding);
        
        if (localYMax - localYMin < 5) {
          const center = (localYMax + localYMin) / 2;
          localYMin = Math.max(0, center - 2.5);
          localYMax = Math.min(100, center + 2.5);
        }
      }
      
      const yRange = localYMax - localYMin;
      
      yAxisDatasets.forEach((dataset) => {
        if (dataset.data[dataIndex] !== undefined) {
          const value = dataset.data[dataIndex];
          newFocusedValues[dataset.label] = value;
          
          // Y position: value is scaled to dynamic range, chart Y goes from top to bottom
          // So localYMax should be at topMargin, localYMin should be at (topMargin + plotHeight)
          const yPercent = (value - localYMin) / yRange;
          const yPos = topMargin + (plotHeight * (1 - yPercent));
          newYPositions[dataset.label] = yPos;
        }
      });
      
      setFocusedValues(newFocusedValues);
      setHoverYPositions(newYPositions);

      // Use the actual data point's date (not interpolated)
      const hoveredDateObj = xAxisData[dataIndex];
      const formattedDate = hoveredDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedTime = hoveredDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setHoveredDate(formattedDate);
      setHoveredTime(formattedTime);

      // Notify parent component with the actual percentage and price value
      if (onHoverPositionChange) {
        // Get the actual price value at this data point (same as what's displayed)
        const hoveredPrice = newFocusedValues[yAxisDatasets[0]?.label];
        onHoverPositionChange(actualPercentage * 100, hoveredDateObj, hoveredPrice);
      }
    }
  };

  // Touch start handler
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      // Record initial touch position
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      isScrolling.current = false;
      setIsTouching(true);
      updatePosition(e.touches[0].clientX);
    }
  };

  // Touch move handler - continuously follows finger
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0 && touchStartPos.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      // Detect if this is a vertical scroll (not determined yet)
      if (!isScrolling.current && deltaY > 0) {
        // If vertical movement is greater than horizontal, it's a scroll
        if (deltaY > deltaX) {
          isScrolling.current = true;
        }
      }
      
      // Only update chart position if not scrolling vertically
      if (!isScrolling.current) {
        updatePosition(touch.clientX);
      }
    }
  };

  // Touch end handler
  const handleTouchEnd = () => {
    touchStartPos.current = null;
    isScrolling.current = false;
    setIsTouching(false);
    resetToLatest();
  };

  // Mouse handlers for desktop compatibility
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsTouching(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Always update position on mouse move (hover), not just when dragging
    updatePosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsTouching(false);
    resetToLatest();
  };

  const handleMouseLeave = () => {
    // Always reset on mouse leave
    setIsTouching(false);
    resetToLatest();
  };

  const resetToLatest = () => {
    setHoveredDate(null);
    setHoveredTime(null);
    setHoverXPosition(null);
    setHoverYPositions({});

    if (onHoverPositionChange) {
      onHoverPositionChange(null);
    }

    // Reset to latest values
    const latestValues: { [key: string]: number } = {};
    yAxisDatasets.forEach((dataset) => {
      if (dataset.data.length > 0) {
        latestValues[dataset.label] = dataset.data[dataset.data.length - 1];
      }
    });
    setFocusedValues(latestValues);
  };

  // Handle loading state
  if (loading) {
    return null;
  }

  // Handle error state
  if (error) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff5f5',
          borderRadius: '8px',
          border: '1px solid #ffcccc',
        }}
      >
        <p style={{ color: '#cc0000' }}>Error: {error}</p>
      </div>
    );
  }

  // Handle no data
  if (seriesData.length === 0 || yAxisDatasets.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <p style={{ color: '#666' }}>No chart data available</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .MuiChartsTooltip-root,
        .MuiChartsTooltip-paper,
        .MuiPopper-root[data-popper-placement],
        div[role="tooltip"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: '100%' }}>
        <div
          ref={chartContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            borderRadius: '12px',
            padding: '0px',
            position: 'relative',
            touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal pan
            cursor: isTouching ? 'grabbing' : 'grab',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Market title at top - full width */}
          {!hideOverlay && title && (
            <h1
              className="text-white font-semibold"
              style={{
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: titleFontSize,
                position: 'absolute',
                top: '5px',
                left: '10px',
                color: '#FFFFFF',
                margin: 0,
                zIndex: 10,
                maxWidth: containerWidth > 0 ? `${containerWidth - 20}px` : '100%',
                paddingRight: '10px',
                lineHeight: '1.2',
                whiteSpace: 'normal',
                wordBreak: 'normal',
                overflowWrap: 'normal',
                pointerEvents: 'none', // Don't interfere with chart interaction
              }}
            >
              {title}
            </h1>
          )}

          {/* Odds display - positioned below title */}
          {!hideOverlay && (
            <div
              style={{
                position: 'absolute',
                top: '85px',
                left: '10px',
                zIndex: 10,
                textAlign: 'left',
                pointerEvents: 'none', // Don't interfere with chart interaction
              }}
            >
              {yAxisDatasets.map((dataset) => (
                <div
                  key={dataset.label}
                  style={{
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    color: '#FFFFFF',
                    marginBottom: yAxisDatasets.length > 1 ? '4px' : '0',
                  }}
                >
                  {yAxisDatasets.length > 1 && (
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      marginBottom: '0px',
                      lineHeight: '1.1',
                    }}>
                      {dataset.label}
                    </div>
                  )}
                  <div style={{
                    fontSize: yAxisDatasets.length > 1 ? '18px' : valueFontSize,
                    fontWeight: 600,
                    lineHeight: '1.1',
                  }}>
                    {focusedValues[dataset.label] !== undefined ? (
                      <>
                        <CountingNumber number={focusedValues[dataset.label]} decimalPlaces={0} />
                        <span>% Chance</span>
                      </>
                    ) : (
                      '-- % Chance'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom vertical hover line */}
          {hoverXPosition !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${hoverXPosition}px`,
                top: hideOverlay ? '10px' : '60px',
                bottom: '10px',
                width: '1px',
                backgroundColor: '#FFFFFF',
                opacity: 0.8,
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          )}

          {/* Custom hover dots on chart line(s) */}
          {hoverXPosition !== null && yAxisDatasets.map((dataset) => {
            const yPos = hoverYPositions[dataset.label];
            if (yPos === undefined) return null;
            
            return (
              <div
                key={`dot-${dataset.label}`}
                style={{
                  position: 'absolute',
                  left: `${hoverXPosition}px`,
                  top: `${yPos}px`,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: yAxisDatasets.length === 1 ? '#FFFFFF' : dataset.color,
                  border: '2px solid #181818',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                }}
              />
            );
          })}

          {/* Custom date and time label at top of hover line */}
          {hoveredDate && hoverXPosition !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${hoverXPosition}px`,
                top: '50px',
                transform: 'translateX(-50%)',
                color: '#FFFFFF',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                pointerEvents: 'none',
                zIndex: 10,
                textAlign: 'center',
                lineHeight: '1.3',
              }}
            >
              <div>{hoveredDate}</div>
              {hoveredTime && <div style={{ fontSize: '10px', opacity: 0.8 }}>{hoveredTime}</div>}
            </div>
          )}

          {/* Simple white line - no gradient effect */}
          <LineChart
            xAxis={[
              {
                data: xAxisData,
                scaleType: 'time',
                valueFormatter: (date: Date) => {
                  // Format based on timeframe for better readability
                  if (selectedTimeframe === '1D') {
                    return date.toLocaleString('en-US', {
                      hour: 'numeric',
                      hour12: true,
                    });
                  }
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                },
              },
            ]}
            yAxis={[
              {
                min: yMin,
                max: yMax,
                disableTicks: true,
                disableLine: true,
              },
            ]}
            series={yAxisDatasets.map((dataset) => ({
              data: dataset.data,
              label: dataset.label,
              color: yAxisDatasets.length === 1 ? '#FFFFFF' : dataset.color, // Simple white line for single series
              area: false,
              showMark: false,
              curve: 'catmullRom',
            }))}
            height={height}
            margin={{ top: hideOverlay ? 10 : 60, right: 0, bottom: 30, left: -50 }}
            disableAxisListener={true}
            grid={{ horizontal: false, vertical: false }}
            sx={{
              width: '100%',
              height: '100%',
              '& .MuiChartsLegend-root': {
                display: 'none',
              },
              '& .MuiLineElement-root': {
                strokeWidth: 2.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                opacity: 0.8, // Slightly transparent white line
              },
              '& .MuiChartsAxis-line': {
                stroke: 'transparent',
                strokeWidth: 0,
                display: 'none',
              },
              '& .MuiChartsAxis-bottom .MuiChartsAxis-line': {
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
                fill: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              },
              '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                fill: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
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
          />
        </div>

        {/* Timeframe buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '4px',
            paddingBottom: '8px',
          }}
        >
          {(['1D', '1W', '1M', 'ALL'] as Timeframe[]).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              style={{
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: selectedTimeframe === timeframe ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: selectedTimeframe === timeframe ? '#181818' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '60px',
              }}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

