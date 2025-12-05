'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryFilter, { CATEGORIES } from './CategoryFilter';
import { API_CONFIG } from '@/lib/api/config';

interface CalendarProps {
  view: 'week' | 'month';
  isDarkMode?: boolean;
  onDateSelect?: (date: Date) => void;
  onCategoryChange?: (category: string) => void;
}

export default function Calendar({ view, isDarkMode = true, onDateSelect, onCategoryChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Start with today's month
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Auto-select today's date on mount
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [direction, setDirection] = useState(0); // Track direction of month change
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Notify parent when category changes
  useEffect(() => {
    if (onCategoryChange) {
      onCategoryChange(selectedCategory);
    }
  }, [selectedCategory, onCategoryChange]);

  // Fetch events from Polymarket API
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '500',
          active: 'true',
          closed: 'false',
          sortBy: 'volume',
          order: 'desc',
        });

        if (selectedCategory !== 'all') {
          const categoryDef = CATEGORIES.find(c => c.id === selectedCategory);
          if (categoryDef) {
            // Use label as tag for search, or fallback to category name mapping
            // The API accepts 'tags' which can be multiple
            // For simplicity, we'll use the label as the tag
            params.append('tags', categoryDef.label);
          }
        }

        const response = await fetch(`${API_CONFIG.baseURL}/api/markets/search?${params.toString()}`);
        const data = await response.json();
        setEvents(data.items || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCategory]);

  const handleDateClick = (date: Date) => {
    // Normalize the date to midnight to ensure consistent matching
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    setSelectedDate(normalizedDate);
    if (onDateSelect) {
      onDateSelect(normalizedDate);
    }
  };

  // Notify parent of initial selected date on mount
  useEffect(() => {
    if (selectedDate && onDateSelect) {
      onDateSelect(selectedDate);
    }
  }, []); // Empty dependency array - only run on mount

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if event is a sports game
  const isSportsEvent = useCallback((event: any): boolean => {
    // Check tags or category if available
    if (event.tags && Array.isArray(event.tags)) {
      const sportsTags = ['Sports', 'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'UFC', 'MMA'];
      if (event.tags.some((t: string) => sportsTags.some(st => t.toLowerCase() === st.toLowerCase()))) {
        return true;
      }
    }
    
    // Check title for "vs" pattern
    const title = event.question || event.title || '';
    return /(.+?)\s+(?:vs\.?|@)\s+(.+)/i.test(title);
  }, []);

  // Helper function to get the display date for an event
  const getEventDisplayDate = useCallback((event: any): Date | null => {
    // Use endDate or endDateIso as the primary date (Settlement Date)
    if (event.endDate) {
      return new Date(event.endDate);
    }
    if (event.endDateIso) {
        return new Date(event.endDateIso);
    }
    
    // Fallback to startDate if available
    if (event.events && event.events.length > 0 && event.events[0].startDate) {
        return new Date(event.events[0].startDate);
    }
    
    return null;
  }, []);

  // Group events by their display date
  const eventsByDate = useMemo((): Map<string, any[]> => {
    const dateMap = new Map<string, any[]>();

    if (!events || events.length === 0) return dateMap;

    // Patterns to exclude (crypto up/down markets and other recurring short-term events)
    const excludePatterns = [
      /up or down/i,
      /\d+m-\d+/i, // Matches patterns like "15m-1763536500"
    ];

    events.forEach((event) => {
      // Skip events matching exclude patterns
      const eventTitle = event.question || event.title || '';
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
  }, [events, getEventDisplayDate, isSportsEvent]);

  const getEventsForDate = (date: Date): any[] => {
    const key = formatDateKey(date);
    const events = eventsByDate.get(key) || [];

    // Sort by liquidity (highest first), with null/undefined values at the end
    return events.sort((a, b) => {
      const liquidityA = Number(a.liquidity) || 0;
      const liquidityB = Number(b.liquidity) || 0;
      return liquidityB - liquidityA;
    });
  };

  // Helper function to get team info for sports events
  const getTeamsForEvent = useCallback((event: any): {
    teamA: undefined;
    teamB: undefined;
    teamAName: string;
    teamBName: string;
  } => {
    // Parse team names from the title
    const title = event.question || event.title || '';

    // Common patterns: "Team A vs. Team B", "Team A vs Team B", "Team A @ Team B"
    const vsPattern = /(.+?)\s+(?:vs\.?|@)\s+(.+)/i;
    const match = title.match(vsPattern);

    if (match) {
      const teamAName = match[1].trim();
      const teamBName = match[2].trim();

      return {
        teamA: undefined,
        teamB: undefined,
        teamAName,
        teamBName,
      };
    }

    return {
      teamA: undefined,
      teamB: undefined,
      teamAName: 'Team A',
      teamBName: 'Team B',
    };
  }, []);

  // Helper function to format event display text
  const getEventDisplayText = useCallback((event: any): string => {
    const { teamAName, teamBName } = getTeamsForEvent(event);

    // For sports events, show team names
    if (isSportsEvent(event)) {
      return `${teamAName} vs ${teamBName}`;
    }

    // For non-sports events, show the title
    return event.question || event.title || 'Untitled Event';
  }, [getTeamsForEvent, isSportsEvent]);

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    const sunday = new Date(curr.setDate(curr.getDate() - curr.getDay()));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour} ${period}`;
  });

  const navigateMonth = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (dir === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
      setDirection(-1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
      setDirection(1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  if (view === 'month') {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const weeks = [];
    let days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -(startingDayOfWeek - i - 1));
      days.push({ date: prevMonthDate, isCurrentMonth: false });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });

      if (days.length === 7) {
        weeks.push(days);
        days = [];
      }
    }

    // Add remaining days from next month
    if (days.length > 0) {
      const remainingDays = 7 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
      weeks.push(days);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="text-xl font-semibold transition-opacity hover:opacity-70"
              style={{ color: isDarkMode ? 'white' : '#242424' }}
            >
              ‹
            </button>
            <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? 'white' : '#242424' }}>
              {getMonthName(currentDate)}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="text-xl font-semibold transition-opacity hover:opacity-70"
              style={{ color: isDarkMode ? 'white' : '#242424' }}
            >
              ›
            </button>
          </div>

          {/* Category Filter */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold py-2"
                style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="flex-1 flex flex-col gap-1 relative min-h-0 overflow-hidden">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                className="flex-1 flex flex-col gap-1 absolute inset-0 overflow-hidden"
              >
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1 flex-1 min-h-0">
                    {week.map((day, dayIndex) => {
                      // Don't render days outside current month
                      if (!day.isCurrentMonth) {
                        return <div key={dayIndex} />;
                      }

                      const events = getEventsForDate(day.date);
                      const isToday = day.date.getTime() === today.getTime();
                      const isSelected = selectedDate && day.date.getTime() === selectedDate.getTime();
                      const dayStr = day.date.getDate();
                      const eventCount = events.length;

                      return (
                        <motion.div
                          key={dayIndex}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            delay: (weekIndex * 7 + dayIndex) * 0.01
                          }}
                          onClick={() => handleDateClick(day.date)}
                          className="relative rounded-lg p-2 cursor-pointer overflow-hidden flex flex-col min-h-0"
                          style={{
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            border: isSelected
                              ? '2px solid white'
                              : '1px solid transparent',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div
                            className="text-xs font-medium mb-1 shrink-0"
                            style={{ color: isToday ? '#2E5CFF' : (isDarkMode ? 'white' : '#242424') }}
                          >
                            {dayStr}
                          </div>

                          {/* Show event count badge if there are events */}
                          {eventCount > 0 && (
                            <div
                              className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full text-center"
                              style={{
                                backgroundColor: isDarkMode ? 'rgba(46, 92, 255, 0.4)' : 'rgba(46, 92, 255, 0.3)',
                                color: isDarkMode ? 'white' : '#242424',
                              }}
                              title={events.map(e => getEventDisplayText(e)).join('\n')}
                            >
                              {eventCount} {eventCount === 1 ? 'event' : 'events'}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // Week View (not currently used but kept for completeness)
  return null;
}













