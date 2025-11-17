'use client';

import { useState } from 'react';
import PillButton from '../../components/PillButton';

export default function MobileHome() {
  const [selectedTab, setSelectedTab] = useState<'Latest' | 'Following'>('Latest');

  const headlines = [
    "Rockstar Games employee reveals GTA VI may be further delayed",
    "Trump is projected to win FIFA Peace Prize",
    "Nancy Pelosi announces her retirement from congress",
    "How high will the US national debt go?",
    "Trump says he will \"help\" communist Mamdani",
    "Rockstar Games employee reveals GTA VI may be further delayed",
    "Trump is projected to win FIFA Peace Prize",
    "Nancy Pelosi announces her retirement from congress",
    "How high will the US national debt go?",
    "Trump says he will \"help\" communist Mamdani",
    "Rockstar Games employee reveals GTA VI may be further delayed",
    "Trump is projected to win FIFA Peace Prize",
    "Meta announces new VR headset with advanced haptic feedback",
    "Apple's iPhone 16 sales exceed expectations in Q4",
    "Climate summit reaches historic agreement on carbon emissions",
    "SpaceX successfully launches Mars mission with crew of six",
    "AI breakthrough: New model achieves human-level reasoning",
    "Global stock markets rally after Fed interest rate decision",
    "Netflix announces record subscriber growth amid content expansion",
    "Tesla unveils new Model Y with 500-mile range capability",
    "Microsoft acquires gaming studio for $2.5 billion deal",
    "Amazon Web Services launches quantum computing platform",
    "Google's new search algorithm prioritizes factual accuracy",
    "Bitcoin reaches new all-time high amid institutional adoption",
    "OpenAI releases GPT-5 with enhanced multimodal capabilities",
    "European Union passes comprehensive AI regulation framework",
    "NASA discovers potentially habitable exoplanet 40 light-years away",
    "TikTok faces new privacy concerns over data collection practices",
    "Uber expands autonomous vehicle testing to five new cities",
    "Samsung unveils foldable smartphone with improved durability",
    "YouTube introduces new creator monetization features",
    "Intel announces breakthrough in quantum processor development",
    "Twitter rebrands platform interface with major design overhaul",
    "Spotify reaches 500 million monthly active users milestone",
    "Adobe launches AI-powered video editing suite for creators",
    "Zoom integrates advanced translation features for global meetings",
    "LinkedIn introduces new professional networking AI assistant",
    "Instagram tests new shopping features for small businesses",
    "WhatsApp adds end-to-end encryption for group video calls",
    "Reddit goes public with successful IPO raising $748 million",
    "Discord announces gaming-focused streaming platform launch",
    "Snapchat introduces AR shopping experiences for retail brands",
    "Pinterest unveils new visual search technology using AI",
    "Twitch expands creator support programs with higher revenue splits"
  ];

  return (
    <div 
      className="min-h-screen relative"
      style={{ backgroundColor: '#242424' }}
    >
      {/* Fixed Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-10"
        style={{ 
          backgroundColor: '#242424',
          paddingTop: '60px', // Account for status bar
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        {/* Date Header */}
        <h1 
          className="text-white mb-6"
          style={{ 
            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: '28px'
          }}
        >
          Thursday November 6, 2025
        </h1>

        {/* Pill Buttons */}
        <div className="flex gap-3">
          <PillButton
            label="Latest"
            isSelected={selectedTab === 'Latest'}
            onClick={() => setSelectedTab('Latest')}
          />
          <PillButton
            label="Following"
            isSelected={selectedTab === 'Following'}
            onClick={() => setSelectedTab('Following')}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="overflow-y-auto"
        style={{ 
          paddingTop: '140px', // Reduced padding to allow content to go behind header
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '40px',
          height: '100vh',
          maskImage: "linear-gradient(to bottom, transparent 60px, black 300px, black calc(100% - 80px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 60px, black 300px, black calc(100% - 80px), transparent 100%)"
        }}
      >
        {headlines.map((headline, index) => (
          <div
            key={index}
            className="text-white"
            style={{
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '21px',
              fontWeight: 'normal',
              lineHeight: '25px',
              marginBottom: '21px',
              marginTop: index === 0 ? '80px' : '0px' // Add top margin to first item
            }}
          >
            {headline}
          </div>
        ))}
      </div>
    </div>
  );
}

