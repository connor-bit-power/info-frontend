'use client';

import { useState } from 'react';
import GradientBackground from '../../components/GradientBackground';
import Header, { TabType } from '../components/Header';
import NewsFeed from '../components/NewsFeed';
import EventView from '../components/EventView';
import mockHeadlines from '../components/MockHeadlines.json';
import type { HeadlineItem } from '@/types/news-api';

export default function MobileHome() {
  const [selectedTab, setSelectedTab] = useState<TabType>('Latest');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedHeadline, setSelectedHeadline] = useState<HeadlineItem | null>(null);
  const [isEventViewOpen, setIsEventViewOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Use mock headlines from JSON (casted to correct type for now)
  const headlines: HeadlineItem[] = mockHeadlines as unknown as HeadlineItem[];

  const handleHeadlineClick = (headline: HeadlineItem, index: number) => {
    setSelectedHeadline(headline);
    setIsEventViewOpen(true);
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
      style={{ overscrollBehavior: 'none' }}
    >
      <GradientBackground isDarkMode={isDarkMode} flipped={true} verticalOffset={15} />
      
      {/* Conditional rendering based on view */}
      {!isEventViewOpen ? (
        <>
          {/* Header - stacked on top */}
          <div className="relative z-10 shrink-0">
            <Header 
              selectedTab={selectedTab} 
              onTabChange={setSelectedTab}
              scrollProgress={scrollProgress}
            />
          </div>

          {/* News Feed - fills remaining space */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <NewsFeed 
              headlines={headlines}
              onHeadlineClick={handleHeadlineClick}
              onScroll={handleScroll}
            />
          </div>
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
