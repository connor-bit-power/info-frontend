'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSpring, animated } from '@react-spring/web';
import { useHeadlines } from '@/hooks/useHeadlines';

import Header from '../components/Header';
import NewsFeed from '../components/NewsFeed';
import EventView from '../components/EventView';

import type { HeadlineItem } from '@/types/news-api';

export default function MobileHome() {
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedTab') || 'Latest';
    }
    return 'Latest';
  });

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    localStorage.setItem('selectedTab', tab);
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedHeadline, setSelectedHeadline] = useState<HeadlineItem | null>(null);
  const [isEventViewOpen, setIsEventViewOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const router = useRouter();

  // Use cached headlines hook
  const { headlines } = useHeadlines();

  // Calculate popular tags
  const allTags = headlines.flatMap(h => h.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTags = Object.entries(tagCounts)
    .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
    .slice(0, 7)
    .map(([tag]) => tag);

  const tabs = ['Latest', ...sortedTags];

  // Filter headlines
  const filteredHeadlines = selectedTab === 'Latest'
    ? headlines
    : headlines.filter(h => h.tags?.includes(selectedTab));

  // Animation for feed changes
  const [springs, api] = useSpring(() => ({
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 300, friction: 20 },
  }), [selectedTab]); // Re-run when selectedTab changes

  const handleHeadlineClick = (headline: HeadlineItem, index: number) => {
    localStorage.setItem('selectedHeadline', JSON.stringify(headline));
    router.push('/mobile/related');
  };

  const handleBackToFeed = () => {
    setIsEventViewOpen(false);
    setSelectedHeadline(null);
  };

  const handleScroll = (progress: number) => {
    setScrollProgress(progress);
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden fixed top-0 left-0 flex flex-col"
      style={{ overscrollBehavior: 'none', backgroundColor: '#181818' }}
    >

      {/* Conditional rendering based on view */}
      {!isEventViewOpen ? (
        <>
          {/* Header - stacked on top */}
          <div className="relative z-10 shrink-0">
            <Header
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              scrollProgress={scrollProgress}
              tabs={tabs}
            />
          </div>

          {/* News Feed - fills remaining space */}
          <animated.div
            className="relative z-10 flex-1 flex flex-col min-h-0"
            style={springs}
          >
            <NewsFeed
              headlines={filteredHeadlines}
              onHeadlineClick={handleHeadlineClick}
              onScroll={handleScroll}
            />
          </animated.div>
        </>
      ) : (
        /* Event View - full screen */
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          <EventView
            headline={selectedHeadline?.title || ''}
            onBack={handleBackToFeed}
          />
        </div>
      )}
    </div>
  );
}
