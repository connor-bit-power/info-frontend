'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

// Color palette for multi-outcome charts
const CHART_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];

// Chart margin configuration
const CHART_MARGINS = {
  top: 60,
  topCompact: 10,
  right: 0,
  bottom: 30,
  left: 0, // Changed to 0 - we'll hide y-axis labels with CSS instead
};

/**
 * Calculate Y-axis range with padding for visualization
 */
function calculateYRange(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 100 };

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  const padding = range * 0.1;

  let min = Math.max(0, dataMin - padding);
  let max = Math.min(100, dataMax + padding);

  // Ensure minimum range of 5% for flat data
  if (max - min < 5) {
    const center = (max + min) / 2;
    min = Math.max(0, center - 2.5);
    max = Math.min(100, center + 2.5);
  }

  return { min, max };
}

/**
 * Filter data points based on selected timeframe
 */
function filterByTimeframe(history: PriceHistoryPoint[], timeframe: Timeframe): PriceHistoryPoint[] {
  if (timeframe === 'ALL' || history.length === 0) return history;

  const now = Date.now() / 1000;
  const cutoffs: Record<Exclude<Timeframe, 'ALL'>, number> = {
    '1D': 24 * 60 * 60,
    '1W': 7 * 24 * 60 * 60,
    '1M': 30 * 24 * 60 * 60,
  };

  const cutoffTime = now - cutoffs[timeframe];
  return history.filter(point => point.t >= cutoffTime);
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
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('ALL');
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Hover state - store actual pixel positions from SVG
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Touch tracking refs
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isScrolling = useRef(false);

  // Normalize input: convert single data prop to series format
  const seriesData = useMemo(() => {
    return series || (data ? [{ label: outcome, data }] : []);
  }, [series, data, outcome]);

  // Process chart data based on timeframe
  const { xAxisData, datasets, yRange } = useMemo(() => {
    if (seriesData.length === 0 || !seriesData[0].data?.history) {
      return { xAxisData: [], datasets: [], yRange: { min: 0, max: 100 } };
    }

    // Use first series to establish x-axis (timestamps should be aligned)
    const filteredHistory = filterByTimeframe(seriesData[0].data.history, selectedTimeframe);
    const xAxis = filteredHistory.map(point => new Date(point.t * 1000));

    // Process each series
    const processedDatasets = seriesData
      .filter(s => s.data?.history)
      .map((s, index) => {
        const filtered = filterByTimeframe(s.data!.history, selectedTimeframe);
        return {
          label: s.label,
          data: filtered.map(point => point.p * 100),
          color: s.color || (seriesData.length > 1 ? CHART_COLORS[index % CHART_COLORS.length] : undefined),
        };
      });

    // Calculate Y range from all data points
    const allValues = processedDatasets.flatMap(d => d.data);
    const range = calculateYRange(allValues);

    return { xAxisData: xAxis, datasets: processedDatasets, yRange: range };
  }, [seriesData, selectedTimeframe]);

  // Current display values (hovered or latest)
  const displayValues = useMemo(() => {
    const values: Record<string, number> = {};
    datasets.forEach(dataset => {
      if (dataset.data.length > 0) {
        const index = hoverIndex !== null ? hoverIndex : dataset.data.length - 1;
        values[dataset.label] = dataset.data[index] ?? dataset.data[dataset.data.length - 1];
      }
    });
    return values;
  }, [datasets, hoverIndex]);

  // Hovered date/time strings
  const hoveredDateTime = useMemo(() => {
    if (hoverIndex === null || !xAxisData[hoverIndex]) return null;
    const date = xAxisData[hoverIndex];
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  }, [hoverIndex, xAxisData]);

  // Parse the SVG path to extract actual point coordinates
  const getPathPoints = useCallback((): { x: number; y: number }[] => {
    if (!chartContainerRef.current) return [];

    const pathElement = chartContainerRef.current.querySelector('.MuiLineElement-root') as SVGPathElement;
    if (!pathElement) return [];

    const d = pathElement.getAttribute('d');
    if (!d) return [];

    // Parse path commands - linear paths use M (move) and L (line) commands
    const points: { x: number; y: number }[] = [];
    const commands = d.match(/[ML][^ML]*/g);

    if (commands) {
      for (const cmd of commands) {
        const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
        if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          points.push({ x: coords[0], y: coords[1] });
        }
      }
    }

    return points;
  }, []);

  // Get position for a data index by reading from the actual SVG path
  const getPointPosition = useCallback((index: number): { x: number; y: number } | null => {
    const points = getPathPoints();
    if (index < 0 || index >= points.length) return null;
    return points[index];
  }, [getPathPoints]);

  // Convert client X coordinate to data index and get position
  const getDataIndexFromX = useCallback((clientX: number): { index: number; position: { x: number; y: number } } | null => {
    if (!chartContainerRef.current || xAxisData.length < 2) return null;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;

    const points = getPathPoints();
    if (points.length === 0) return null;

    // Find the nearest point by X coordinate
    let nearestIndex = 0;
    let nearestDiff = Math.abs(points[0].x - x);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - x);
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestIndex = i;
      }
    }

    return { index: nearestIndex, position: points[nearestIndex] };
  }, [xAxisData.length, getPathPoints]);

  // Update hover state and notify parent
  const updateHover = useCallback((result: { index: number; position: { x: number; y: number } } | null) => {
    if (!result) {
      setHoverIndex(null);
      setHoverPosition(null);
      if (onHoverPositionChange) {
        onHoverPositionChange(null);
      }
      return;
    }

    setHoverIndex(result.index);
    setHoverPosition(result.position);

    if (onHoverPositionChange && datasets.length > 0 && xAxisData[result.index]) {
      const percentage = (result.index / Math.max(1, datasets[0].data.length - 1)) * 100;
      const price = datasets[0].data[result.index];
      onHoverPositionChange(percentage, xAxisData[result.index], price);
    }
  }, [datasets, xAxisData, onHoverPositionChange]);

  // Reset hover state
  const resetHover = useCallback(() => {
    setHoverIndex(null);
    setHoverPosition(null);
    setIsInteracting(false);
    if (onHoverPositionChange) {
      onHoverPositionChange(null);
    }
  }, [onHoverPositionChange]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isScrolling.current = false;
    setIsInteracting(true);

    const result = getDataIndexFromX(touch.clientX);
    updateHover(result);
  }, [getDataIndexFromX, updateHover]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0 || !touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Detect vertical scroll
    if (!isScrolling.current && deltaY > deltaX && deltaY > 5) {
      isScrolling.current = true;
    }

    // Only update hover if not scrolling
    if (!isScrolling.current) {
      const result = getDataIndexFromX(touch.clientX);
      updateHover(result);
    }
  }, [getDataIndexFromX, updateHover]);

  const handleTouchEnd = useCallback(() => {
    touchStartPos.current = null;
    isScrolling.current = false;
    resetHover();
  }, [resetHover]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const result = getDataIndexFromX(e.clientX);
    updateHover(result);
  }, [getDataIndexFromX, updateHover]);

  const handleMouseDown = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsInteracting(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    resetHover();
  }, [resetHover]);

  // Track container width
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

  // Loading state
  if (loading) return null;

  // Error state
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

  // No data state
  if (datasets.length === 0) {
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

  const topMargin = hideOverlay ? CHART_MARGINS.topCompact : CHART_MARGINS.top;

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
            position: 'relative',
            touchAction: 'pan-y',
            cursor: isInteracting ? 'grabbing' : 'grab',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Title overlay */}
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
                pointerEvents: 'none',
              }}
            >
              {title}
            </h1>
          )}

          {/* Values overlay */}
          {!hideOverlay && (
            <div
              style={{
                position: 'absolute',
                top: '85px',
                left: '10px',
                zIndex: 10,
                textAlign: 'left',
                pointerEvents: 'none',
              }}
            >
              {datasets.map(dataset => (
                <div
                  key={dataset.label}
                  style={{
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    color: '#FFFFFF',
                    marginBottom: datasets.length > 1 ? '4px' : '0',
                  }}
                >
                  {datasets.length > 1 && (
                    <div style={{ fontSize: '11px', opacity: 0.7, lineHeight: '1.1' }}>
                      {dataset.label}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: datasets.length > 1 ? '18px' : valueFontSize,
                      fontWeight: 600,
                      lineHeight: '1.1',
                    }}
                  >
                    {displayValues[dataset.label] !== undefined ? (
                      <>
                        <CountingNumber number={displayValues[dataset.label]} decimalPlaces={0} />
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

          {/* Hover vertical line - positioned using actual SVG coordinates */}
          {hoverPosition && (
            <div
              style={{
                position: 'absolute',
                left: `${hoverPosition.x}px`,
                top: `${topMargin}px`,
                bottom: `${CHART_MARGINS.bottom}px`,
                width: '1px',
                backgroundColor: '#FFFFFF',
                opacity: 0.8,
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          )}

          {/* Hover dot - positioned using actual SVG coordinates */}
          {hoverPosition && (
            <div
              style={{
                position: 'absolute',
                left: `${hoverPosition.x}px`,
                top: `${hoverPosition.y}px`,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '2px solid #181818',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}

          {/* Hover date/time label */}
          {hoveredDateTime && hoverPosition && (
            <div
              style={{
                position: 'absolute',
                left: `${hoverPosition.x}px`,
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
              <div>{hoveredDateTime.date}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>{hoveredDateTime.time}</div>
            </div>
          )}

          {/* MUI LineChart */}
          <LineChart
            xAxis={[
              {
                data: xAxisData,
                scaleType: 'time',
                valueFormatter: (date: Date) =>
                  selectedTimeframe === '1D'
                    ? date.toLocaleString('en-US', { hour: 'numeric', hour12: true })
                    : date.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
              },
            ]}
            yAxis={[
              {
                min: yRange.min,
                max: yRange.max,
                disableTicks: true,
                disableLine: true,
              },
            ]}
            series={datasets.map(dataset => ({
              data: dataset.data,
              label: dataset.label,
              color: datasets.length === 1 ? '#FFFFFF' : dataset.color,
              area: false,
              showMark: false,
              curve: 'linear',
            }))}
            height={height}
            margin={{
              top: topMargin,
              right: CHART_MARGINS.right,
              bottom: CHART_MARGINS.bottom,
              left: CHART_MARGINS.left,
            }}
            disableAxisListener={true}
            tooltip={{ trigger: 'none' }}
            axisHighlight={{ x: 'none', y: 'none' }}
            grid={{ horizontal: false, vertical: false }}
            sx={{
              width: '100%',
              height: '100%',
              '& .MuiChartsLegend-root': { display: 'none' },
              '& .MuiLineElement-root': {
                strokeWidth: 2.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                opacity: 0.8,
              },
              '& .MuiChartsAxis-line': {
                stroke: 'transparent',
                display: 'none',
              },
              '& .MuiChartsAxis-tick': {
                stroke: 'transparent',
                display: 'none',
              },
              '& .MuiChartsAxis-tickLabel': {
                fill: 'rgba(255, 255, 255, 0.7) !important',
                fontSize: '11px',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              },
              '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                fill: 'rgba(255, 255, 255, 0.7) !important',
              },
              '& .MuiChartsAxis-bottom text': {
                fill: 'rgba(255, 255, 255, 0.7) !important',
              },
              '& .MuiChartsAxis-left': { display: 'none' },
              '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { display: 'none' },
              '& .MuiChartsTooltip-root, & .MuiChartsTooltip-paper, & .MuiPopper-root': {
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
          {(['1D', '1W', '1M', 'ALL'] as Timeframe[]).map(timeframe => (
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
