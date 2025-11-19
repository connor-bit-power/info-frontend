'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TopNav, { TopNavRef } from '../components/TopNav';
import GradientBackground from '../../components/GradientBackground';
import ThemeToggler from '../../components/ThemeToggler';
import NewsTile from '../components/NewsTile';
import ChartTile from '../components/ChartTile';
import CalendarTile from '../components/CalendarTile';
import Calendar from '../../../components/Calendar';
import CalendarItem from '../components/CalendarItem';
import { useActiveEvents, useEvents } from '../../../lib/hooks/useEvents';
import type { Event, Market, Tag } from '../../../types/polymarket';
import { CATEGORIES } from '../../../components/CategoryFilter';

export default function DesktopHome() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const topNavRef = useRef<TopNavRef>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMarketSlug, setSelectedMarketSlug] = useState<string>('trump-agrees-to-sell-f-35-to-saudi-arabia-by-november-30');
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch active events for the calendar event list
  const { events: generalEvents } = useActiveEvents({
    limit: 500,
  });

  // Fetch major sports leagues events
  // Tag IDs from gamma-api.polymarket.com/sports metadata
  const { events: nflEvents } = useEvents({
    tag_id: 450, // NFL
    closed: false,
    limit: 300,
  });

  const { events: nbaEvents } = useEvents({
    tag_id: 745, // NBA
    closed: false,
    limit: 500,
  });

  const { events: mlbEvents } = useEvents({
    tag_id: 3420, // MLB
    closed: false,
    limit: 300,
  });

  const { events: nhlEvents } = useEvents({
    tag_id: 899, // NHL
    closed: false,
    limit: 300,
  });

  const { events: soccerEvents } = useEvents({
    tag_id: 100350, // Soccer (general)
    closed: false,
    limit: 500,
  });

  const { events: mmaEvents } = useEvents({
    tag_id: 279, // UFC
    closed: false,
    limit: 200,
  });

  const { events: cfbEvents } = useEvents({
    tag_id: 100351, // College Football
    closed: false,
    limit: 300,
  });

  // Fetch non-sports category events
  const { events: politicsEvents } = useEvents({
    tag_id: 2, // Politics
    closed: false,
    limit: 500,
  });

  const { events: cryptoEvents } = useEvents({
    tag_id: 21, // Crypto
    closed: false,
    limit: 300,
  });

  const { events: businessEvents } = useEvents({
    tag_id: 107, // Business
    closed: false,
    limit: 300,
  });

  const { events: earningsEvents } = useEvents({
    tag_id: 1013, // Earnings
    closed: false,
    limit: 300,
  });

  const { events: cultureEvents } = useEvents({
    tag_id: 596, // Culture
    closed: false,
    limit: 300,
  });

  const { events: scienceEvents } = useEvents({
    tag_id: 74, // Science
    closed: false,
    limit: 200,
  });

  const { events: newsEvents } = useEvents({
    tag_id: 198, // News
    closed: false,
    limit: 300,
  });

  // Combine all events
  const allEvents = useMemo(() => {
    return [
      ...(generalEvents || []),
      ...(nflEvents || []),
      ...(cfbEvents || []),
      ...(nbaEvents || []),
      ...(mlbEvents || []),
      ...(nhlEvents || []),
      ...(soccerEvents || []),
      ...(mmaEvents || []),
      ...(politicsEvents || []),
      ...(cryptoEvents || []),
      ...(businessEvents || []),
      ...(earningsEvents || []),
      ...(cultureEvents || []),
      ...(scienceEvents || []),
      ...(newsEvents || []),
    ];
  }, [generalEvents, nflEvents, cfbEvents, nbaEvents, mlbEvents, nhlEvents, soccerEvents, mmaEvents, politicsEvents, cryptoEvents, businessEvents, earningsEvents, cultureEvents, scienceEvents, newsEvents]);

  // Filter events based on selected category
  const events = useMemo(() => {
    if (selectedCategory === 'all') return allEvents;

    let filtered: Event[] = [];
    
    switch (selectedCategory) {
      case 'nfl':
        filtered = [...(nflEvents || [])];
        break;
      case 'cfb':
        filtered = [...(cfbEvents || [])];
        break;
      case 'nba':
        filtered = [...(nbaEvents || [])];
        break;
      case 'mlb':
        filtered = [...(mlbEvents || [])];
        break;
      case 'nhl':
        filtered = [...(nhlEvents || [])];
        break;
      case 'soccer':
        filtered = [...(soccerEvents || [])];
        break;
      case 'mma':
        filtered = [...(mmaEvents || [])];
        break;
      case 'esports':
        filtered = [...(generalEvents || [])].filter(event => 
          (event.tags as Tag[] | undefined)?.some((t: Tag) => t.id === '64')
        );
        break;
      case 'sports':
        filtered = [
          ...(nflEvents || []),
          ...(cfbEvents || []),
          ...(nbaEvents || []),
          ...(mlbEvents || []),
          ...(nhlEvents || []),
          ...(soccerEvents || []),
          ...(mmaEvents || []),
        ];
        break;
      case 'politics':
        filtered = [...(politicsEvents || [])];
        break;
      case 'crypto':
        filtered = [...(cryptoEvents || [])];
        break;
      case 'business':
        filtered = [...(businessEvents || [])];
        break;
      case 'earnings':
        filtered = [...(earningsEvents || [])];
        break;
      case 'culture':
        filtered = [...(cultureEvents || [])];
        break;
      case 'science':
        filtered = [...(scienceEvents || [])];
        break;
      case 'news':
        filtered = [...(newsEvents || [])];
        break;
      case 'finance':
      case 'economy':
      case 'entertainment':
        const categoryDef = CATEGORIES.find(c => c.id === selectedCategory);
        if (categoryDef && categoryDef.tagIds && categoryDef.tagIds.length > 0) {
          filtered = allEvents.filter(event => {
            const eventTags = (event.tags as Tag[] | undefined) || [];
            return eventTags.some(tag => categoryDef.tagIds?.includes(parseInt(tag.id)));
          });
        }
        break;
      default:
        filtered = (generalEvents || []).filter(event => {
          return !event.markets?.some(m => m.gameStartTime);
        });
        break;
    }

    return filtered;
  }, [allEvents, selectedCategory, generalEvents, nflEvents, cfbEvents, nbaEvents, mlbEvents, nhlEvents, soccerEvents, mmaEvents, politicsEvents, cryptoEvents, businessEvents, earningsEvents, cultureEvents, scienceEvents, newsEvents]);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleEventClick = (eventSlug: string) => {
    setSelectedMarketSlug(eventSlug);
  };

  const handleDateSelect = (date: Date) => {
    console.log('📆 ========== DATE SELECT CALLED ==========');
    console.log('📆 Incoming date:', date);
    console.log('📆 Incoming date timestamp:', date.getTime());
    
    // Normalize the date to midnight to ensure consistent matching
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const key = formatDateKey(normalizedDate);
    
    console.log('📆 Normalized date:', normalizedDate);
    console.log('📆 Normalized timestamp:', normalizedDate.getTime());
    console.log('📆 Date key:', key);
    console.log('📆 Events available for this date:', eventsByDate.get(key)?.length || 0);
    console.log('📆 Current selectedDate before update:', selectedDate);
    console.log('📆 Current selectedDate timestamp:', selectedDate?.getTime());
    
    // Force a new Date object to ensure React detects the change
    const newDate = new Date(normalizedDate.getTime());
    console.log('📆 Setting new selected date:', newDate);
    console.log('📆 New date timestamp:', newDate.getTime());
    setSelectedDate(newDate);
    console.log('📆 ==========================================');
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if event is a sports game
  const isSportsEvent = useCallback((event: Event): boolean => {
    if (!event.markets || event.markets.length === 0) return false;
    // Sports events have gameStartTime (team IDs are often not present)
    return event.markets.some(
      (market: Market) => market.gameStartTime
    );
  }, []);

  // Helper function to get the display date for an event
  const getEventDisplayDate = useCallback((event: Event): Date | null => {
    // For sports events, use gameStartTime from any market that has it
    if (event.markets) {
      const marketWithGameTime = event.markets.find(m => m.gameStartTime);
      if (marketWithGameTime?.gameStartTime) {
        return new Date(marketWithGameTime.gameStartTime);
      }
    }
    // For non-sports events, use endDate (settle date)
    if (event.endDate) {
      return new Date(event.endDate);
    }
    return null;
  }, []);

  // Group events by their display date (gameStartTime for sports, endDate for others)
  const eventsByDate = useMemo((): Map<string, Event[]> => {
    const dateMap = new Map<string, Event[]>();
    
    if (!events || events.length === 0) return dateMap;

    // Patterns to exclude (crypto up/down markets and other recurring short-term events)
    const excludePatterns = [
      /up or down/i,
      /\d+m-\d+/i,
    ];

    events.forEach((event) => {
      const eventTitle = event.title || '';
      const eventSlug = event.slug || '';
      const shouldExclude = excludePatterns.some(
        pattern => pattern.test(eventTitle) || pattern.test(eventSlug)
      );
      if (shouldExclude) return;

      const displayDate = getEventDisplayDate(event);
      if (!displayDate) return;

      displayDate.setHours(0, 0, 0, 0);
      const dateKey = formatDateKey(displayDate);
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(event);
    });

    return dateMap;
  }, [events, getEventDisplayDate]);

  const getEventsForDate = useCallback((date: Date): Event[] => {
    const key = formatDateKey(date);
    const events = eventsByDate.get(key) || [];
    console.log('🗓️ Getting events for', key, '- Found:', events.length);
    return events;
  }, [eventsByDate]);

  // Memoize events for the selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) {
      console.log('📋 No selected date');
      return [];
    }
    const key = formatDateKey(selectedDate);
    const events = eventsByDate.get(key) || [];
    
    // Deduplicate events by ID (in case the same event appears multiple times)
    const seenIds = new Set<string>();
    const uniqueEvents = events.filter(event => {
      if (seenIds.has(event.id)) {
        console.warn('⚠️ Duplicate event detected:', event.id, event.title);
        return false;
      }
      seenIds.add(event.id);
      return true;
    });
    
    console.log('📋 ========== SELECTED DATE EVENTS ==========');
    console.log('📋 Selected date:', selectedDate);
    console.log('📋 Date key:', key);
    console.log('📋 Raw events count:', events.length);
    console.log('📋 Unique events count:', uniqueEvents.length);
    console.log('📋 Event IDs:', uniqueEvents.map(e => e.id));
    console.log('📋 First 3 event titles:', uniqueEvents.slice(0, 3).map(e => e.title));
    console.log('📋 eventsByDate map size:', eventsByDate.size);
    console.log('📋 ==========================================');
    return uniqueEvents;
  }, [selectedDate, eventsByDate]);

  // Debug: Log when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const key = formatDateKey(selectedDate);
      console.log('🔄 Selected date changed to:', key);
      console.log('🔄 Events for this date:', selectedDateEvents.length);
      console.log('🔄 Total dates in map:', eventsByDate.size);
    }
  }, [selectedDate, selectedDateEvents, eventsByDate]);

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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
      // Use window dimensions instead of container ref since we're now scrolling
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Account for TopNav height (approximately 180px based on padding)
      const topNavHeight = 180;
      const availableHeight = viewportHeight - topNavHeight;
      
      setContainerHeight(availableHeight);
      setContainerWidth(viewportWidth);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate tile dimensions dynamically to fit in window
  const GAP = 16;
  const CONTAINER_PADDING = 32; // padding on left and right
  
  // Calculate dimensions based on available space
  // First row has 3 tiles, second row has 1 tile (Calendar instead of Treemap)
  const calculateTileDimensions = () => {
    if (containerHeight === 0 || containerWidth === 0) {
      return {
        tallTileWidth: 0,
        tallTileHeight: 0,
        chartTileWidth: 0,
        chartTileHeight: 0,
        calendarTileWidth: 0,
        calendarTileHeight: 0,
        fullCalendarTileWidth: 0,
        fullCalendarTileHeight: 0,
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
    let fullCalendarTileHeight = chartTileHeight;
    // Make the full calendar wider - double the chart width
    let fullCalendarTileWidth = chartTileWidth * 2;

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
      fullCalendarTileWidth = Math.floor(fullCalendarTileWidth * scaleFactor);
      fullCalendarTileHeight = Math.floor(fullCalendarTileHeight * scaleFactor);
    }

    return {
      tallTileWidth,
      tallTileHeight,
      chartTileWidth,
      chartTileHeight,
      calendarTileWidth,
      calendarTileHeight,
      fullCalendarTileWidth,
      fullCalendarTileHeight,
    };
  };

  const {
    tallTileWidth,
    tallTileHeight,
    chartTileWidth,
    chartTileHeight,
    calendarTileWidth,
    calendarTileHeight,
    fullCalendarTileWidth,
    fullCalendarTileHeight,
  } = calculateTileDimensions();

  return (
    <div className="h-screen w-screen overflow-hidden fixed top-0 left-0">
      <GradientBackground isDarkMode={isDarkMode} />
      {/* Theme Toggler - Top Right */}
      <div className="absolute top-8 right-8 z-20">
        <ThemeToggler isDarkMode={isDarkMode} onToggle={handleToggle} />
      </div>
      
      <div className="relative z-10 h-full overflow-y-auto">
        <TopNav ref={topNavRef} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        
        {/* Main content area with tiles */}
        <div 
          className="pb-8 pt-2" 
          style={{ paddingLeft: '32px', paddingRight: '32px' }}
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
                    marketId={selectedMarketSlug}
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
                    onEventClick={handleEventClick}
                  />
                </div>
              </div>

              {/* Second Row */}
              <div style={{ display: 'flex', gap: `${GAP}px` }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    width: fullCalendarTileWidth, 
                    height: fullCalendarTileHeight, 
                    flexShrink: 0,
                    backgroundColor: 'rgba(217, 217, 217, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    padding: '32px',
                    display: 'flex',
                    gap: '24px',
                  }}
                >
                  {/* Calendar Section - 55% of width */}
                  <div style={{ 
                    flex: '0 0 55%',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Calendar 
                      view="month" 
                      isDarkMode={isDarkMode} 
                      onDateSelect={handleDateSelect}
                      onCategoryChange={setSelectedCategory}
                    />
                  </div>

                  {/* Event List Section - 45% of width */}
                  <div 
                    style={{ 
                      flex: '0 0 calc(45% - 24px)', // Account for gap
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <style jsx>{`
                      .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <h3
                      className="text-white"
                      style={{
                        fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                        fontSize: '22px',
                        fontWeight: 600,
                        marginBottom: '12px',
                      }}
                    >
                      {selectedDate ? formatSelectedDate(selectedDate) : 'Select a date'}
                    </h3>

                    <div 
                      className="hide-scrollbar"
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingTop: '10px',
                        paddingBottom: '40px',
                        maskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      {selectedDate ? (
                        <>
                          {selectedDateEvents.length > 0 ? (
                            <>
                              {selectedDateEvents.map((event, index, array) => (
                                <CalendarItem
                                  key={`${formatDateKey(selectedDate!)}-${event.id}`}
                                  event={event}
                                  isDarkMode={isDarkMode}
                                  isFirst={index === 0}
                                  isLast={index === array.length - 1}
                                />
                              ))}
                            </>
                          ) : (
                            <p
                              className="text-white"
                              style={{
                                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                                fontSize: '18px',
                                fontWeight: 400,
                                opacity: 0.4,
                                fontStyle: 'italic',
                                marginTop: '12px',
                              }}
                            >
                              No events scheduled
                            </p>
                          )}
                        </>
                      ) : (
                        <p
                          className="text-white"
                          style={{
                            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                            fontSize: '18px',
                            fontWeight: 400,
                            opacity: 0.4,
                            fontStyle: 'italic',
                            marginTop: '12px',
                          }}
                        >
                          Click on a date to view events
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
