'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHeadlines } from '@/hooks/useHeadlines';

import Header from '../components/Header';
import NewsFeed from '../components/NewsFeed';
import EventView from '../components/EventView';
import Modal from '../components/Modal';
import { InfoCircleIcon } from '@/app/components/icons/InfoCircleIcon';

import type { FeedItem } from '@/types/news-api';

export default function MobileHome() {
  const [selectedHeadline, setSelectedHeadline] = useState<FeedItem | null>(null);
  const [selectedAlertMarketId, setSelectedAlertMarketId] = useState<string | null>(null);
  const [isEventViewOpen, setIsEventViewOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const router = useRouter();

  // Use cached headlines hook
  const { headlines, loading } = useHeadlines();

  const handleHeadlineClick = (headline: FeedItem, index: number) => {
    // Check if this is an alert (has alertData)
    if (headline.feedType !== 'headline' && headline.alertData) {
      // For alerts, open EventView with the market
      setSelectedAlertMarketId(headline.alertData.marketId);
      setSelectedHeadline(headline);
      setIsEventViewOpen(true);
    } else {
      // For regular headlines, navigate to related page
      localStorage.setItem('selectedHeadline', JSON.stringify(headline));
      router.push('/mobile/related');
    }
  };

  const handleBackToFeed = () => {
    setIsEventViewOpen(false);
    setSelectedHeadline(null);
    setSelectedAlertMarketId(null);
  };

  const handleScroll = (progress: number) => {
    setScrollProgress(progress);
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden fixed top-0 left-0 flex flex-col"
      style={{ overscrollBehavior: 'none', backgroundColor: '#242424' }}
    >

      {/* Conditional rendering based on view */}
      {!isEventViewOpen ? (
        <>
          {/* Header - stacked on top */}
          <div className="relative z-10 shrink-0">
            <Header scrollProgress={scrollProgress} />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute top-6 right-4 p-2 text-white/50 hover:text-white transition-colors z-50"
            >
              <InfoCircleIcon size="md" />
            </button>
          </div>

          {/* News Feed - fills remaining space */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <NewsFeed
              headlines={headlines}
              onHeadlineClick={handleHeadlineClick}
              onScroll={handleScroll}
              loading={loading}
            />
          </div>
        </>
      ) : (
        /* Event View - full screen */
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          <EventView
            headline={selectedHeadline?.title || ''}
            marketId={selectedAlertMarketId || undefined}
            onBack={handleBackToFeed}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="How it works"
      >
        <p className="pb-2">
          Our AI agents scan the world's information to bring you the most important stories, verified and summarized for clarity.
        </p>
        <p>
          We analyze thousands of sources in real-time to provide you with accurate, unbiased updates on what matters most.
        </p>
      </Modal>
    </div>
  );
}
