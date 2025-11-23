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
  onHoverPositionChange?: (percentage: number | null, hoveredDate?: Date) => void;
  titleFontSize?: string;
  valueFontSize?: string;
  hideOverlay?: boolean;
}

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
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isTouching, setIsTouching] = useState(false);

  // Determine if we're using single data prop or series prop
  const seriesData = series || (data ? [{ label: outcome, data }] : []);

  // Color palette for multi-outcome charts
  const colors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
  ];

  // Transform data for MUI X Charts
  let xAxisData: Date[] = [];
  const yAxisDatasets: { label: string; data: number[]; color?: string }[] = [];

  if (seriesData.length > 0 && seriesData[0].data?.history) {
    xAxisData = seriesData[0].data.history.map((point) => new Date(point.t * 1000));

    seriesData.forEach((s, index) => {
      if (s.data?.history) {
        const yData = s.data.history.map((point) => point.p * 100);
        yAxisDatasets.push({
          label: s.label,
          data: yData,
          color: s.color || (seriesData.length > 1 ? colors[index % colors.length] : undefined),
        });
      }
    });
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

      const chartWidth = rect.width;
      const xInChart = x;

      const percentage = Math.max(0, Math.min(100, (xInChart / chartWidth) * 100));
      setHoverXPosition(x);

      // Calculate the corresponding data point index and values
      const dataIndex = Math.floor((percentage / 100) * (yAxisDatasets[0]?.data.length - 1 || 0));
      const newFocusedValues: { [key: string]: number } = {};
      yAxisDatasets.forEach((dataset) => {
        if (dataset.data[dataIndex] !== undefined) {
          newFocusedValues[dataset.label] = dataset.data[dataIndex];
        }
      });
      setFocusedValues(newFocusedValues);

      // Calculate and format the hovered date
      const startDate = xAxisData[0];
      const endDate = xAxisData[xAxisData.length - 1];
      const timeRange = endDate.getTime() - startDate.getTime();
      const hoveredTimestamp = startDate.getTime() + (percentage / 100) * timeRange;
      const hoveredDateObj = new Date(hoveredTimestamp);
      const formattedDate = hoveredDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedTime = hoveredDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setHoveredDate(formattedDate);
      setHoveredTime(formattedTime);

      // Notify parent component
      if (onHoverPositionChange) {
        onHoverPositionChange(percentage, hoveredDateObj);
      }
    }
  };

  // Touch start handler
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsTouching(true);
    if (e.touches.length > 0) {
      updatePosition(e.touches[0].clientX);
    }
  };

  // Touch move handler - continuously follows finger
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent scrolling while dragging
    if (e.touches.length > 0) {
      updatePosition(e.touches[0].clientX);
    }
  };

  // Touch end handler
  const handleTouchEnd = () => {
    setIsTouching(false);
    resetToLatest();
  };

  // Mouse handlers for desktop compatibility
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsTouching(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouching) {
      updatePosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsTouching(false);
    resetToLatest();
  };

  const handleMouseLeave = () => {
    if (isTouching) {
      setIsTouching(false);
      resetToLatest();
    }
  };

  const resetToLatest = () => {
    setHoveredDate(null);
    setHoveredTime(null);
    setHoverXPosition(null);

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
      <div style={{ width: '100%' }}>
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
            touchAction: 'none', // Prevent default touch behaviors
            cursor: isTouching ? 'grabbing' : 'grab',
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
                      <CountingNumber number={focusedValues[dataset.label]} />
                    ) : (
                      '-- % Chance'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                },
              },
            ]}
            yAxis={[
              {
                min: 0,
                max: 100,
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
            margin={{ top: hideOverlay ? 10 : 60, right: 0, bottom: 10, left: -50 }}
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
          />
        </div>
      </div>
    </>
  );
}

