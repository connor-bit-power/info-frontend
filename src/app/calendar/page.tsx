'use client';

import { useState, useMemo } from 'react';
import GradientBackground from '../components/GradientBackground';
import ThemeToggler from '../components/ThemeToggler';
import Calendar from '../../components/Calendar';
import CalendarItem from '../desktop/components/CalendarItem';
import { useActiveEvents } from '../../lib/hooks/useEvents';
import type { Event } from '../../types/polymarket';

export default function CalendarPage() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch active events
  const { events, isLoading, error } = useActiveEvents({
    limit: 500,
  });

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group events by their end date (settle date)
  const eventsByDate = useMemo((): Map<string, Event[]> => {
    const dateMap = new Map<string, Event[]>();
    
    if (!events || events.length === 0) return dateMap;

    // Patterns to exclude (crypto up/down markets and other recurring short-term events)
    const excludePatterns = [
      /up or down/i,
      /\d+m-\d+/i, // Matches patterns like "15m-1763536500"
    ];

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

      const dateKey = formatDateKey(eventEndDate);
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(event);
    });

    return dateMap;
  }, [events]);

  const getEventsForDate = (date: Date): Event[] => {
    const key = formatDateKey(date);
    return eventsByDate.get(key) || [];
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .event-title:hover {
          opacity: 0.7;
        }
      `}</style>
      <div className="h-screen w-screen overflow-hidden fixed top-0 left-0">
        <GradientBackground isDarkMode={isDarkMode} />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Theme Toggler - Top Right */}
        <div className="absolute top-8 right-8 z-20">
          <ThemeToggler isDarkMode={isDarkMode} onToggle={handleToggle} />
        </div>

        {/* Header */}
        <div className="pt-12 pb-8 px-12">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              color: isDarkMode ? 'white' : '#1a1a1a',
            }}
          >
            Calendar
          </h1>
          <p
            className="text-lg"
            style={{
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            }}
          >
            Month calendar view
          </p>
        </div>

        {/* Calendar Tiles Container */}
        <div className="flex-1 overflow-y-auto px-12 pb-12">
          <div className="max-w-[1400px] mx-auto">
            {/* Month View Tile */}
            <div
              className="rounded-3xl p-8 h-[800px] flex gap-6"
              style={{
                backgroundColor: 'rgba(217, 217, 217, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Calendar Section */}
              <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
                <div className="flex-1" style={{ minHeight: 0 }}>
                  <Calendar view="month" isDarkMode={isDarkMode} onDateSelect={handleDateSelect} />
                </div>
              </div>

              {/* Event List Section */}
              <div className="w-80 flex flex-col" style={{ minWidth: 0 }}>
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
                  className="flex-1 overflow-y-auto hide-scrollbar"
                  style={{
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
                      {getEventsForDate(selectedDate).length > 0 ? (
                        <>
                          {getEventsForDate(selectedDate).map((event, index, array) => (
                            <CalendarItem
                              key={event.id}
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
      </div>
    </div>
    </>
  );
}

