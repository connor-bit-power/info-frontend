'use client';

import { useState } from 'react';
import TopNav from '../components/TopNav';
import GradientBackground from '../../components/GradientBackground';
import ThemeToggler from '../../components/ThemeToggler';
import DraggableGrid from '../components/DraggableGrid';

export default function DesktopHome() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="h-screen w-screen overflow-hidden fixed top-0 left-0">
      <GradientBackground isDarkMode={isDarkMode} />
      <div className="relative z-10 h-full flex flex-col">
        {/* Theme Toggler - Top Right */}
        <div className="absolute top-8 right-8 z-20">
          <ThemeToggler isDarkMode={isDarkMode} onToggle={handleToggle} />
        </div>
        
        <TopNav isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        
        {/* Main content area with draggable grid */}
        <div className="flex-1 pb-8 pt-2" style={{ minHeight: 0, paddingLeft: '32px', paddingRight: '32px' }}>
          <div className="h-full">
            <DraggableGrid isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
