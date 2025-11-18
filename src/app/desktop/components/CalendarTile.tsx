'use client';

import { useRef, useMemo, useState } from 'react';
import Tile from './Tile';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { useActiveEvents } from '../../../lib/hooks/useEvents';
import type { Event } from '../../../types/polymarket';

interface CalendarTileProps {
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

interface EventsByDate {
  date: Date;
  events: Event[];
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function CalendarTile({
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
}: CalendarTileProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Date range state - defaults to next 7 days from today
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return { from: today, to: sevenDaysFromNow };
  });

  // Fetch active events - fetch enough to ensure we have diverse events
  // We need a higher limit because many events are recurring crypto markets that we filter out
  const { events, isLoading, error } = useActiveEvents({
    limit: 500,
  });

  const handleDateRangeUpdate = (values: { range: { from: Date | undefined; to: Date | undefined }; rangeCompare?: { from: Date | undefined; to: Date | undefined } }) => {
    console.log('Date range updated:', values);
    
    if (values.range.from && values.range.to) {
      // Ensure dates are at start of day
      const fromDate = new Date(values.range.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(values.range.to);
      toDate.setHours(23, 59, 59, 999); // End of day for inclusive comparison
      
      setDateRange({ from: fromDate, to: toDate });
    }
  };

  // Group events by their end date based on selected date range
  const eventsByDate = useMemo((): EventsByDate[] => {
    if (!events || events.length === 0 || !dateRange.from || !dateRange.to) return [];

    const startDate = new Date(dateRange.from);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(dateRange.to);
    endDate.setHours(23, 59, 59, 999);

    // Calculate number of days in range
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const numDays = Math.min(daysDiff + 1, 365); // Cap at 365 days for performance

    // Create array of dates for the selected range
    const dateMap = new Map<string, EventsByDate>();
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      dateMap.set(dateKey, { date, events: [] });
    }

    // Patterns to exclude (crypto up/down markets and other recurring short-term events)
    const excludePatterns = [
      /up or down/i,
      /\d+m-\d+/i, // Matches patterns like "15m-1763536500"
    ];

    // Filter and group events by end date
    events.forEach((event) => {
      if (!event.endDate) return;

      // Skip events matching exclude patterns
      const eventTitle = event.title || '';
      const eventSlug = event.slug || '';
      const shouldExclude = excludePatterns.some(
        pattern => pattern.test(eventTitle) || pattern.test(eventSlug)
      );
      if (shouldExclude) return;

      const eventEndDate = new Date(event.endDate);
      eventEndDate.setHours(0, 0, 0, 0);

      // Only include events that close within the selected date range
      if (eventEndDate >= startDate && eventEndDate <= endDate) {
        const dateKey = eventEndDate.toISOString().split('T')[0];
        const dateEntry = dateMap.get(dateKey);
        if (dateEntry) {
          dateEntry.events.push(event);
        }
      }
    });

    // Convert map to array (keep all dates to show empty states)
    return Array.from(dateMap.values());
  }, [events, dateRange]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .event-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .event-image {
          flex-shrink: 0;
          border-radius: 6px;
          object-fit: cover;
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
          <div className="flex justify-between items-center" style={{ position: 'absolute', top: '15px', left: '30px', right: '30px' }}>
            <h1 
              className="text-white font-semibold"
              style={{ 
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '28px',
              }}
            >
              Market Calendar
            </h1>
            <div className="flex items-center gap-3">
              <DateRangePicker
                onUpdate={handleDateRangeUpdate}
                align="end"
                showCompare={false}
                placeholder="Select Date Range"
                triggerIcon={<CalendarIcon size="md" className="text-white opacity-85" />}
                initialDateFrom={dateRange.from}
                initialDateTo={dateRange.to}
              />
            </div>
          </div>

          {/* Events list - Scrollable */}
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto hide-scrollbar"
            style={{ 
              position: 'absolute',
              top: '60px',
              left: '15px',
              right: '30px',
              bottom: '30px',
              paddingLeft: '15px',
              paddingTop: '10px',
              paddingBottom: '40px',
              maskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {isLoading && (
              <div className="text-white" style={{ 
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '18px',
                opacity: 0.7,
                marginTop: '20px'
              }}>
                Loading events...
              </div>
            )}

            {error && (
              <div className="text-white" style={{ 
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '18px',
                opacity: 0.7,
                marginTop: '20px',
                color: '#ff6b6b'
              }}>
                Error loading events
              </div>
            )}

            {!isLoading && !error && eventsByDate.map((dateEntry, dateIndex) => (
              <div 
                key={`date-${dateEntry.date.toISOString()}`}
                style={{
                  marginTop: dateIndex === 0 ? '12px' : '36px',
                }}
              >
                {/* Date header */}
                <h2
                  className="text-white"
                  style={{
                    fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                    fontSize: '22px',
                    fontWeight: 600,
                    opacity: 0.7,
                    marginBottom: '12px',
                  }}
                >
                  {formatDate(dateEntry.date)}
                  {dateEntry.events.length > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '18px', opacity: 0.5 }}>
                      ({dateEntry.events.length})
                    </span>
                  )}
                </h2>

                {/* Event list for this date */}
                {dateEntry.events.length === 0 ? (
                  <p
                    className="text-white"
                    style={{
                      fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                      fontSize: '18px',
                      fontWeight: 400,
                      opacity: 0.4,
                      fontStyle: 'italic',
                    }}
                  >
                    No events closing
                  </p>
                ) : (
                  dateEntry.events.map((event, eventIndex) => (
                    <div
                      key={`event-${event.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: eventIndex === 0 ? '0px' : '12px',
                      }}
                    >
                      {/* Event Image */}
                      {event.image && (
                        <img
                          src={event.image}
                          alt=""
                          className="event-image"
                          style={{
                            width: '40px',
                            height: '40px',
                          }}
                        />
                      )}
                      
                      {/* Event Title */}
                      <div
                        className="event-title text-white"
                        style={{
                          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                          fontSize: '18px',
                          fontWeight: 400,
                          lineHeight: '1.3',
                          flex: 1,
                          minWidth: 0, // Important for text truncation in flex container
                        }}
                      >
                        {event.title || 'Untitled Event'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </Tile>
    </>
  );
}


