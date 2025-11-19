'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveEvents, useEvents } from '../lib/hooks/useEvents';
import { useTeams, useSportsMetadata } from '../lib/hooks/useSports';
import type { Event, Market, Team, Tag } from '../types/polymarket';
import CategoryFilter, { CATEGORIES } from './CategoryFilter';

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

  // Notify parent when category changes
  useEffect(() => {
    if (onCategoryChange) {
      onCategoryChange(selectedCategory);
    }
  }, [selectedCategory, onCategoryChange]);

  // Fetch active events - fetch enough to ensure we have diverse events
  const { events: generalEvents, isLoading: generalLoading, error: generalError } = useActiveEvents({
    limit: 500,
  });

  // Fetch major sports leagues events
  // Tag IDs from gamma-api.polymarket.com/sports metadata
  const { events: nflEvents, isLoading: nflLoading } = useEvents({
    tag_id: 450, // NFL
    closed: false,
    limit: 300,
  });

  const { events: nbaEvents, isLoading: nbaLoading } = useEvents({
    tag_id: 745, // NBA
    closed: false,
    limit: 500,
  });

  const { events: mlbEvents, isLoading: mlbLoading } = useEvents({
    tag_id: 3420, // MLB
    closed: false,
    limit: 300,
  });

  const { events: nhlEvents, isLoading: nhlLoading } = useEvents({
    tag_id: 899, // NHL
    closed: false,
    limit: 300,
  });

  const { events: soccerEvents, isLoading: soccerLoading } = useEvents({
    tag_id: 100350, // Soccer (general)
    closed: false,
    limit: 500,
  });

  const { events: mmaEvents, isLoading: mmaLoading } = useEvents({
    tag_id: 279, // UFC
    closed: false,
    limit: 200,
  });

  const { events: cfbEvents, isLoading: cfbLoading } = useEvents({
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

  // Combine all events from all sources
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
    console.log('🔍 ========== FILTERING START ==========');
    console.log('🔍 Selected category:', selectedCategory);
    console.log('🔍 Total allEvents:', allEvents.length);
    
    if (selectedCategory === 'all') {
      console.log('🔍 Returning all events (no filter)');
      return allEvents;
    }

    // Map category to event sources
    let filtered: Event[] = [];
    
    switch (selectedCategory) {
      case 'nfl':
        filtered = [...(nflEvents || [])];
        console.log('🔍 NFL filter: returning', filtered.length, 'events');
        break;
      case 'cfb':
        filtered = [...(cfbEvents || [])];
        console.log('🔍 CFB filter: returning', filtered.length, 'events');
        break;
      case 'nba':
        filtered = [...(nbaEvents || [])];
        console.log('🔍 NBA filter: returning', filtered.length, 'events');
        break;
      case 'mlb':
        filtered = [...(mlbEvents || [])];
        console.log('🔍 MLB filter: returning', filtered.length, 'events');
        break;
      case 'nhl':
        filtered = [...(nhlEvents || [])];
        console.log('🔍 NHL filter: returning', filtered.length, 'events');
        break;
      case 'soccer':
        filtered = [...(soccerEvents || [])];
        console.log('🔍 Soccer filter: returning', filtered.length, 'events');
        break;
      case 'mma':
        filtered = [...(mmaEvents || [])];
        console.log('🔍 MMA filter: returning', filtered.length, 'events');
        break;
      case 'esports':
        filtered = [...(generalEvents || [])].filter(event => 
          (event.tags as Tag[] | undefined)?.some((t: Tag) => t.id === '64')
        );
        console.log('🔍 Esports filter: returning', filtered.length, 'events');
        break;
      case 'sports':
        // All sports combined
        filtered = [
          ...(nflEvents || []),
          ...(cfbEvents || []),
          ...(nbaEvents || []),
          ...(mlbEvents || []),
          ...(nhlEvents || []),
          ...(soccerEvents || []),
          ...(mmaEvents || []),
        ];
        console.log('🔍 Sports filter (all): returning', filtered.length, 'events');
        console.log('🔍 Breakdown: NFL:', nflEvents?.length, 'CFB:', cfbEvents?.length, 'NBA:', nbaEvents?.length, 'MLB:', mlbEvents?.length, 'NHL:', nhlEvents?.length, 'Soccer:', soccerEvents?.length, 'MMA:', mmaEvents?.length);
        break;
      case 'politics':
        filtered = [...(politicsEvents || [])];
        console.log('🔍 Politics filter: returning', filtered.length, 'events');
        break;
      case 'crypto':
        filtered = [...(cryptoEvents || [])];
        console.log('🔍 Crypto filter: returning', filtered.length, 'events');
        break;
      case 'business':
        filtered = [...(businessEvents || [])];
        console.log('🔍 Business filter: returning', filtered.length, 'events');
        break;
      case 'earnings':
        filtered = [...(earningsEvents || [])];
        console.log('🔍 Earnings filter: returning', filtered.length, 'events');
        break;
      case 'culture':
        filtered = [...(cultureEvents || [])];
        console.log('🔍 Culture filter: returning', filtered.length, 'events');
        break;
      case 'science':
        filtered = [...(scienceEvents || [])];
        console.log('🔍 Science filter: returning', filtered.length, 'events');
        break;
      case 'news':
        filtered = [...(newsEvents || [])];
        console.log('🔍 News filter: returning', filtered.length, 'events');
        break;
      case 'finance':
      case 'economy':
      case 'entertainment':
        // For categories without dedicated fetches, filter from all events by tag
        console.log('🔍 Multi-tag category selected:', selectedCategory);
        const categoryDef = CATEGORIES.find(c => c.id === selectedCategory);
        if (categoryDef && categoryDef.tagIds && categoryDef.tagIds.length > 0) {
          console.log('🔍 Filtering by tag IDs:', categoryDef.tagIds);
          filtered = allEvents.filter(event => {
            const eventTags = (event.tags as Tag[] | undefined) || [];
            return eventTags.some(tag => categoryDef.tagIds?.includes(parseInt(tag.id)));
          });
          console.log('🔍 Events with matching tags:', filtered.length);
        }
        break;
      default:
        // Fallback: filter out sports events for unknown categories
        console.log('🔍 Unknown category, filtering out sports events');
        filtered = (generalEvents || []).filter(event => {
          const isSports = event.markets?.some(m => m.gameStartTime);
          return !isSports;
        });
        console.log('🔍 After filtering out sports:', filtered.length, 'events');
        break;
    }

    console.log('🔍 Final filtered count:', filtered.length);
    console.log('🔍 ========== FILTERING END ==========');

    return filtered;
  }, [allEvents, selectedCategory, generalEvents, nflEvents, cfbEvents, nbaEvents, mlbEvents, nhlEvents, soccerEvents, mmaEvents, politicsEvents, cryptoEvents, businessEvents, earningsEvents, cultureEvents, scienceEvents, newsEvents]);

  const isLoading = generalLoading || nflLoading || cfbLoading || nbaLoading || mlbLoading || nhlLoading || soccerLoading || mmaLoading;
  const error = generalError;

  // Fetch teams data for sports events
  const { teams, getTeamById } = useTeams({
    limit: 1000,
  });

  // Debug: Check for sports events
  useEffect(() => {
    console.log('📅 Calendar - General events:', generalEvents?.length || 0);
    console.log('📅 Calendar - NFL events:', nflEvents?.length || 0);
    console.log('📅 Calendar - CFB events:', cfbEvents?.length || 0);
    console.log('📅 Calendar - NBA events:', nbaEvents?.length || 0);
    console.log('📅 Calendar - MLB events:', mlbEvents?.length || 0);
    console.log('📅 Calendar - NHL events:', nhlEvents?.length || 0);
    console.log('📅 Calendar - Soccer events:', soccerEvents?.length || 0);
    console.log('📅 Calendar - MMA events:', mmaEvents?.length || 0);
    console.log('📅 Calendar - Total combined events:', allEvents.length);
    console.log('📅 Calendar - Selected category:', selectedCategory);
    console.log('📅 Calendar - Filtered events:', events.length);
    
    if (events && events.length > 0) {
      const sportsEvents = events.filter(e => 
        e.markets && e.markets.some(m => m.gameStartTime)
      );
      console.log('📅 Calendar - Sports events with gameStartTime:', sportsEvents.length);
      
      // Check for NFL/NBA specifically
      const nflSportsEvents = sportsEvents.filter(e => 
        (e.tags as Tag[] | undefined)?.some((t: Tag) => t.id === '450')
      );
      const nbaSportsEvents = sportsEvents.filter(e => 
        (e.tags as Tag[] | undefined)?.some((t: Tag) => t.id === '745')
      );
      
      console.log('📅 Calendar - NFL sports events:', nflSportsEvents.length);
      console.log('📅 Calendar - NBA sports events:', nbaSportsEvents.length);
      
      if (nflSportsEvents.length > 0) {
        const sample = nflSportsEvents[0];
        const gameTime = sample.markets?.find(m => m.gameStartTime)?.gameStartTime;
        console.log('📅 Calendar - Sample NFL event:', {
          title: sample.title,
          gameStartTime: gameTime,
          gameStartParsed: gameTime ? new Date(gameTime) : null,
          endDate: sample.endDate,
        });
      }
      
      if (nbaSportsEvents.length > 0) {
        const sample = nbaSportsEvents[0];
        const gameTime = sample.markets?.find(m => m.gameStartTime)?.gameStartTime;
        console.log('📅 Calendar - Sample NBA event:', {
          title: sample.title,
          gameStartTime: gameTime,
          gameStartParsed: gameTime ? new Date(gameTime) : null,
          endDate: sample.endDate,
        });
      }
    }
  }, [generalEvents, nflEvents, cfbEvents, nbaEvents, mlbEvents, nhlEvents, soccerEvents, mmaEvents, allEvents, selectedCategory, events]);


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
      /\d+m-\d+/i, // Matches patterns like "15m-1763536500"
    ];

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
      const dateKey = formatDateKey(displayDate);
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(event);
    });

    // Debug: Log what dates have events
    const datesWithSports = Array.from(dateMap.entries())
      .filter(([_, evts]) => evts.some(e => isSportsEvent(e)))
      .slice(0, 5);
    
    if (datesWithSports.length > 0) {
      console.log('📅 Calendar - Dates with sports events (first 5):', 
        datesWithSports.map(([date, evts]) => ({
          date,
          count: evts.filter(e => isSportsEvent(e)).length,
          events: evts.filter(e => isSportsEvent(e)).map(e => e.title).slice(0, 2),
        }))
      );
    }

    return dateMap;
  }, [events, getEventDisplayDate, isSportsEvent]);

  const getEventsForDate = (date: Date): Event[] => {
    const key = formatDateKey(date);
    return eventsByDate.get(key) || [];
  };

  // Helper function to get team info for sports events
  const getTeamsForEvent = useCallback((event: Event): { 
    teamA: Team | undefined; 
    teamB: Team | undefined;
    teamAName: string;
    teamBName: string;
  } => {
    // First try to get teams from team IDs (if they exist - rare)
    if (event.markets && event.markets.length > 0) {
      const market = event.markets[0];
      const teamAID = market.teamAID ? parseInt(market.teamAID) : undefined;
      const teamBID = market.teamBID ? parseInt(market.teamBID) : undefined;

      if (teamAID && teamBID) {
        const teamA = getTeamById(teamAID);
        const teamB = getTeamById(teamBID);
        return {
          teamA,
          teamB,
          teamAName: teamA?.abbreviation || teamA?.name || 'Team A',
          teamBName: teamB?.abbreviation || teamB?.name || 'Team B',
        };
      }
    }

    // Otherwise, parse team names from the title
    const title = event.title || '';
    
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
  }, [getTeamById]);

  // Helper function to format event display text
  const getEventDisplayText = useCallback((event: Event): string => {
    const { teamAName, teamBName } = getTeamsForEvent(event);
    
    // For sports events, show team names
    if (isSportsEvent(event)) {
      return `${teamAName} vs ${teamBName}`;
    }
    
    // For non-sports events, show the title
    return event.title || 'Untitled Event';
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
      <div className="flex flex-col h-full" style={{ fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="text-2xl font-semibold transition-opacity hover:opacity-70"
              style={{ color: isDarkMode ? 'white' : '#1a1a1a' }}
            >
              ‹
            </button>
            <h2 className="text-2xl font-semibold" style={{ color: isDarkMode ? 'white' : '#1a1a1a' }}>
              {getMonthName(currentDate)}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="text-2xl font-semibold transition-opacity hover:opacity-70"
              style={{ color: isDarkMode ? 'white' : '#1a1a1a' }}
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
        <div className="flex-1 flex flex-col">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold py-2"
                style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="flex-1 flex flex-col gap-1 relative">
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
                className="flex-1 flex flex-col gap-1 absolute inset-0"
              >
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1 flex-1">
                    {week.map((day, dayIndex) => {
                      // Don't render days outside current month
                      if (!day.isCurrentMonth) {
                        return <div key={dayIndex} />;
                      }

                      const events = getEventsForDate(day.date);
                      const isToday = day.date.getTime() === today.getTime();
                      const isSelected = selectedDate && day.date.getTime() === selectedDate.getTime();
                      const dayStr = day.date.getDate();

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
                          className="relative rounded-lg p-2 cursor-pointer overflow-hidden"
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
                            className="text-sm font-medium mb-1"
                            style={{ color: isToday ? '#2E5CFF' : (isDarkMode ? 'white' : '#1a1a1a') }}
                          >
                            {dayStr}
                          </div>
                          <div className="space-y-1">
                            {events.slice(0, 2).map((event) => {
                              const isSports = isSportsEvent(event);
                              const { teamA, teamB, teamAName, teamBName } = getTeamsForEvent(event);
                              const displayText = isSports ? `${teamAName} vs ${teamBName}` : (event.title || 'Untitled Event');

                              return (
                                <div
                                  key={event.id}
                                  className="text-xs px-1 py-0.5 rounded truncate"
                                  style={{
                                    backgroundColor: isSports 
                                      ? (isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)')
                                      : (isDarkMode ? 'rgba(46, 92, 255, 0.3)' : 'rgba(46, 92, 255, 0.2)'),
                                    color: isDarkMode ? 'white' : '#1a1a1a',
                                  }}
                                  title={displayText}
                                >
                                  {isSports && (teamA?.logo || teamB?.logo) && (
                                    <div className="flex items-center gap-0.5 mb-0.5">
                                      {teamA?.logo && (
                                        <img 
                                          src={teamA.logo} 
                                          alt={teamAName} 
                                          className="w-3 h-3 rounded-sm object-contain"
                                        />
                                      )}
                                      {teamB?.logo && (
                                        <img 
                                          src={teamB.logo} 
                                          alt={teamBName} 
                                          className="w-3 h-3 rounded-sm object-contain"
                                        />
                                      )}
                                    </div>
                                  )}
                                  {displayText}
                                </div>
                              );
                            })}
                            {events.length > 2 && (
                              <div
                                className="text-xs px-1"
                                style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                              >
                                +{events.length - 2} more
                              </div>
                            )}
                          </div>
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












