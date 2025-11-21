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

interface ChartProps {
  data?: PriceHistoryData | null; // Single series (backward compatible)
  series?: SeriesData[]; // Multiple series for multi-outcome markets
  title?: string;
  outcome?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  onHoverPositionChange?: (percentage: number | null, hoveredDate?: Date) => void; // Callback for hover position (0-100) and date
  titleFontSize?: string;
  valueFontSize?: string;
}

export default function Chart({
  data,
  series,
  title = 'Market Odds Over Time',
  outcome = 'Yes',
  height = 400,
  loading = false,
  error = null,
  onHoverPositionChange,
  titleFontSize = '28px',
  valueFontSize = '28px',
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [focusedValues, setFocusedValues] = useState<{ [key: string]: number }>({});
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [hoverXPosition, setHoverXPosition] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Determine if we're using single data prop or series prop
  const seriesData = series || (data ? [{ label: outcome, data }] : []);
  
  // Color palette for multi-outcome charts
  const colors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
  ];
  
  // Transform data for MUI X Charts (do this before early returns to avoid conditional hook calls)
  // For multiple series, we need to align timestamps and create a unified x-axis
  let xAxisData: Date[] = [];
  const yAxisDatasets: { label: string; data: number[]; color?: string }[] = [];
  
  if (seriesData.length > 0 && seriesData[0].data?.history) {
    // Use the first series' timestamps as the x-axis reference
    xAxisData = seriesData[0].data.history.map((point) => new Date(point.t * 1000));
    
    // Transform each series
    seriesData.forEach((s, index) => {
      if (s.data?.history) {
        const yData = s.data.history.map((point) => point.p * 100); // Convert to percentage
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

  // Set initial focused values to latest (rightmost) data points
  useEffect(() => {
    if (yAxisDatasets.length > 0) {
      const initialValues: { [key: string]: number } = {};
      yAxisDatasets.forEach((dataset) => {
        if (dataset.data.length > 0) {
          initialValues[dataset.label] = dataset.data[dataset.data.length - 1];
        }
      });
      // Always update when data changes
      setFocusedValues(initialValues);
    } else {
      // Reset focused values when there's no data
      setFocusedValues({});
    }
  }, [data, series, outcome, yAxisDatasets.length]); // Depend on the actual data props and data length

  // Track mouse position over chart
  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (chartContainerRef.current && xAxisData.length > 0) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      // Account for chart margins
      const chartAreaLeft = 30;
      const chartAreaRight = 30;
      const chartWidth = rect.width - chartAreaLeft - chartAreaRight;
      const xInChart = x - chartAreaLeft;
      
      // Calculate percentage within the actual chart area
      const percentage = Math.max(0, Math.min(100, (xInChart / chartWidth) * 100));
      setHoverPosition(percentage);
      setHoverXPosition(x);
      
      // Calculate the corresponding data point index and values for all series
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
      
      // Notify parent component of hover position change with date
      if (onHoverPositionChange) {
        onHoverPositionChange(percentage, hoveredDateObj);
      }
    }
  };

  // Reset when mouse leaves chart
  const handleChartMouseLeave = () => {
    setHoverPosition(null);
    setHoveredDate(null);
    setHoveredTime(null);
    setHoverXPosition(null);
    
    // Notify parent component that hover ended
    if (onHoverPositionChange) {
      onHoverPositionChange(null);
    }
    
    // Reset to latest values (rightmost data points)
    const latestValues: { [key: string]: number } = {};
    yAxisDatasets.forEach((dataset) => {
      if (dataset.data.length > 0) {
        latestValues[dataset.label] = dataset.data[dataset.data.length - 1];
      }
    });
    setFocusedValues(latestValues);
  };

  // Update gradient when hover position changes
  useEffect(() => {
    const gradient = document.getElementById('lineGradient');
    if (gradient) {
      // Clear existing stops
      while (gradient.firstChild) {
        gradient.removeChild(gradient.firstChild);
      }

      if (hoverPosition !== null) {
        // Create dramatic focused gradient with tight falloff
        const falloffRange = 5;
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.1)');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', `${Math.max(0, hoverPosition - falloffRange)}%`);
        stop2.setAttribute('stop-color', 'rgba(255, 255, 255, 0.1)');

        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop3.setAttribute('offset', `${hoverPosition}%`);
        stop3.setAttribute('stop-color', 'rgba(255, 255, 255, 1)'); // Full opacity at hover

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
      } else {
        // Reset to default gradient if not hovering
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'rgba(255, 255, 255, 0.2)');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'rgba(255, 255, 255, 1)');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
      }
    }
  }, [hoverPosition, data]);

  // Handle loading state - return null to show nothing while loading
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
          onMouseMove={handleChartMouseMove}
          onMouseLeave={handleChartMouseLeave}
          style={{
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
          }}
        >
        {/* Market title at top */}
        {title && (
          <h1 
            className="text-white font-semibold"
            style={{ 
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: titleFontSize,
              position: 'absolute',
              top: '15px',
              left: '30px',
              color: '#FFFFFF',
              margin: 0,
              zIndex: 10,
              maxWidth: containerWidth > 0 ? `${containerWidth - 280}px` : '50%',
              paddingRight: '20px',
              lineHeight: '1.2',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
          >
            {title}
          </h1>
        )}

        {/* Odds display in top right */}
        <div
          style={{ 
            position: 'absolute',
            top: '15px',
            right: '30px',
            zIndex: 10,
            textAlign: 'right',
          }}
        >
          {yAxisDatasets.map((dataset, index) => (
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

        {/* Custom date and time label at top of hover line */}
        {hoveredDate && hoverXPosition !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${hoverXPosition}px`,
              top: '60px',
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

        {/* SVG gradient definition */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 1)" />
            </linearGradient>
          </defs>
        </svg>
        
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
          series={yAxisDatasets.map((dataset, index) => ({
            data: dataset.data,
            label: dataset.label,
            color: yAxisDatasets.length === 1 ? 'url(#lineGradient)' : dataset.color,
            area: false,
            showMark: false,
            curve: 'catmullRom',
          }))}
          height={height}
          margin={{ top: 60, right: 30, bottom: 10, left: -90 }}
          disableAxisListener={true}
          grid={{ horizontal: false, vertical: false }}
          slotProps={{
            legend: { hidden: true },
          }}
          tooltip={{ trigger: 'none' }}
          sx={{
            width: '100%',
            height: '100%',
            '& .MuiLineElement-root': {
              strokeWidth: 2.5,
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
        />
      </div>
      <div
        style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        {yAxisDatasets.length} series • {xAxisData.length} data points
      </div>
    </div>
    </>
  );
}

