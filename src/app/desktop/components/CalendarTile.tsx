'use client';

import { useRef, useMemo, useState } from 'react';
import Tile from './Tile';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { useActiveEvents } from '../../../lib/hooks/useEvents';
import { useTeams } from '../../../lib/hooks/useSports';
import type { Event, Market, Team } from '../../../types/polymarket';
import PillButton from '../../components/PillButton';

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
  onEventClick?: (eventSlug: string) => void;
}

interface EventsByDate {
  date: Date;
  events: Event[];
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

type ViewMode = 'list' | 'calendar';

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
  onEventClick,
}: CalendarTileProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  // Fetch teams data for sports events
  const { teams, getTeamById } = useTeams({
    limit: 1000,
  });

  // Helper function to check if event is a sports game
  const isSportsEvent = (event: Event): boolean => {
    if (!event.markets || event.markets.length === 0) return false;
    // Sports events have gameStartTime and team IDs
    return event.markets.some(
      (market: Market) => market.gameStartTime && (market.teamAID || market.teamBID)
    );
  };

  // Helper function to get the display date for an event
  const getEventDisplayDate = (event: Event): Date | null => {
    // For sports events, use gameStartTime from the first market
    if (isSportsEvent(event) && event.markets && event.markets[0]?.gameStartTime) {
      return new Date(event.markets[0].gameStartTime);
    }
    // For non-sports events, use endDate (settle date)
    if (event.endDate) {
      return new Date(event.endDate);
    }
    return null;
  };

  // Helper function to get team info for sports events
  const getTeamsForEvent = (event: Event): { teamA: Team | undefined; teamB: Team | undefined } => {
    if (!isSportsEvent(event) || !event.markets || event.markets.length === 0) {
      return { teamA: undefined, teamB: undefined };
    }

    const market = event.markets[0];
    const teamAID = market.teamAID ? parseInt(market.teamAID) : undefined;
    const teamBID = market.teamBID ? parseInt(market.teamBID) : undefined;

    return {
      teamA: teamAID ? getTeamById(teamAID) : undefined,
      teamB: teamBID ? getTeamById(teamBID) : undefined,
    };
  };

  // Helper function to format event display text
  const getEventDisplayText = (event: Event): string => {
    const { teamA, teamB } = getTeamsForEvent(event);
    
    if (teamA && teamB) {
      // Show team abbreviations or names for sports events
      const teamAName = teamA.abbreviation || teamA.name || 'Team A';
      const teamBName = teamB.abbreviation || teamB.name || 'Team B';
      return `${teamAName} vs ${teamBName}`;
    }
    
    // For non-sports events, show the title
    return event.title || 'Untitled Event';
  };

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

    // Filter and group events by display date (gameStartTime for sports, endDate for others)
    events.forEach((event) => {
      // Skip events matching exclude patterns
      const eventTitle = event.title || '';
      const eventSlug = event.slug || '';
      const shouldExclude = excludePatterns.some(
        pattern => pattern.test(eventTitle) || pattern.test(eventSlug)
      );
      if (shouldExclude) return;

      const displayDate = getEventDisplayDate(event);
      if (!displayDate) return;

      displayDate.setHours(0, 0, 0, 0);

      // Only include events within the selected date range
      if (displayDate >= startDate && displayDate <= endDate) {
        const dateKey = displayDate.toISOString().split('T')[0];
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

  const handleEventTitleClick = (event: Event) => {
    if (onEventClick && event.slug) {
      onEventClick(event.slug);
    }
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
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .event-title:hover {
          opacity: 0.7;
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
            <div>
              <h1 
                className="text-white font-semibold"
                style={{ 
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  fontSize: '28px',
                  marginBottom: '12px',
                }}
              >
                Market Calendar
              </h1>
              <div className="flex gap-2">
                <div style={{
                  backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'list' ? 'rgba(0, 0, 0, 0.7)' : '#FFFFFF',
                  paddingTop: '7px',
                  paddingBottom: '7px',
                  paddingLeft: '21px',
                  paddingRight: '21px',
                  borderRadius: '9999px',
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none' as const,
                  border: '1px solid #FFFFFF',
                }}
                onClick={() => setViewMode('list')}>
                  List
                </div>
                <div style={{
                  backgroundColor: viewMode === 'calendar' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'calendar' ? 'rgba(0, 0, 0, 0.7)' : '#FFFFFF',
                  paddingTop: '7px',
                  paddingBottom: '7px',
                  paddingLeft: '21px',
                  paddingRight: '21px',
                  borderRadius: '9999px',
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none' as const,
                  border: '1px solid #FFFFFF',
                }}
                onClick={() => setViewMode('calendar')}>
                  Calendar
                </div>
              </div>
            </div>
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

          {/* View Content */}
          {viewMode === 'calendar' ? (
            // Calendar View Placeholder
            <div 
              style={{ 
                position: 'absolute',
                top: '110px',
                left: '30px',
                right: '30px',
                bottom: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p
                className="text-white"
                style={{
                  fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                  fontSize: '24px',
                  opacity: 0.5,
                }}
              >
                Calendar View - Coming Soon
              </p>
            </div>
          ) : (
            // List View
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto hide-scrollbar"
              style={{ 
                position: 'absolute',
                top: '110px',
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
                  dateEntry.events.map((event, eventIndex) => {
                    const isSports = isSportsEvent(event);
                    const { teamA, teamB } = getTeamsForEvent(event);
                    const displayText = getEventDisplayText(event);

                    return (
                      <div
                        key={`event-${event.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: eventIndex === 0 ? '0px' : '12px',
                        }}
                      >
                        {/* Team Logos for Sports or Event Image */}
                        {isSports ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '40px' }}>
                            {teamA?.logo && (
                              <img
                                src={teamA.logo}
                                alt={teamA.name || 'Team A'}
                                className="event-image"
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  objectFit: 'contain',
                                  borderRadius: '2px',
                                }}
                              />
                            )}
                            {teamB?.logo && (
                              <img
                                src={teamB.logo}
                                alt={teamB.name || 'Team B'}
                                className="event-image"
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  objectFit: 'contain',
                                  borderRadius: '2px',
                                }}
                              />
                            )}
                          </div>
                        ) : event.image ? (
                          <img
                            src={event.image}
                            alt=""
                            className="event-image"
                            style={{
                              width: '40px',
                              height: '40px',
                            }}
                          />
                        ) : null}
                        
                        {/* Event Title / Team Names */}
                        <div
                          className="event-title text-white"
                          onClick={() => handleEventTitleClick(event)}
                          style={{
                            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                            fontSize: '18px',
                            fontWeight: 400,
                            lineHeight: '1.3',
                            flex: 1,
                            minWidth: 0, // Important for text truncation in flex container
                            color: isSports ? 'rgba(34, 197, 94, 1)' : 'white',
                          }}
                        >
                          {displayText}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
            </div>
          )}
        </div>
      </Tile>
    </>
  );
}


