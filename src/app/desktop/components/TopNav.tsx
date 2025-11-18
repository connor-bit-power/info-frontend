'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import PillButton from '../../components/PillButton';

interface TopNavProps {
  isDarkMode?: boolean;
  setIsDarkMode?: (isDark: boolean) => void;
}

export interface TopNavRef {
  focusSearch: () => void;
}

const TopNav = forwardRef<TopNavRef, TopNavProps>(({ isDarkMode, setIsDarkMode }: TopNavProps = {}, ref) => {
  const [selectedPill, setSelectedPill] = useState<string>('one');
  const [searchValue, setSearchValue] = useState<string>('');
  const [pills, setPills] = useState<string[]>(['one', 'two', 'three', 'four', 'five']);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isNewTabAnimating, setIsNewTabAnimating] = useState(false);
  const [closingPill, setClosingPill] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Expose focusSearch method to parent component
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
    }
  }));

  const handleNewTab = () => {
    const newTabNumber = pills.length + 1;
    const newTabName = `tab${newTabNumber}`;
    setIsNewTabAnimating(true);
    setPills([...pills, newTabName]);
    setSelectedPill(newTabName);
    setTimeout(() => setIsNewTabAnimating(false), 300);
  };

  const handleClosePill = (e: React.MouseEvent, pillToClose: string) => {
    e.stopPropagation();
    
    // Don't allow closing if it's the last pill
    if (pills.length <= 1) return;
    
    // Trigger close animation
    setClosingPill(pillToClose);
    
    // If closing the selected pill, select another one
    if (selectedPill === pillToClose) {
      const currentIndex = pills.indexOf(pillToClose);
      const newSelectedIndex = currentIndex > 0 ? currentIndex - 1 : 1;
      setSelectedPill(pills[newSelectedIndex]);
    }
    
    // Remove the pill after animation completes
    setTimeout(() => {
      setPills(prevPills => prevPills.filter(p => p !== pillToClose));
      setClosingPill(null);
    }, 250);
  };

  const handleDragStart = (e: React.DragEvent, pill: string) => {
    setDraggedItem(pill);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, pill: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem !== pill) {
      setDragOverItem(pill);
    }
  };

  const handleDrop = (e: React.DragEvent, targetPill: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetPill) return;

    const draggedIndex = pills.indexOf(draggedItem);
    const targetIndex = pills.indexOf(targetPill);

    const newPills = [...pills];
    newPills.splice(draggedIndex, 1);
    newPills.splice(targetIndex, 0, draggedItem);

    setPills(newPills);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <nav 
      className="w-full pt-10 pb-6"
      style={{
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
        paddingLeft: '52px',
        paddingRight: '32px',
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Search Input */}
        <div className="flex items-center gap-3">
          <input
            ref={searchInputRef}
            type="text"
            placeholder=" / to search for a market or topic"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 search-input"
            style={{
              color: '#FFFFFF',
              fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
              fontSize: '24px',
            }}
          />
        </div>

        {/* Pill Buttons */}
        <div 
          className="flex gap-3"
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* +NEW Button */}
          <div
            style={{
              animation: isNewTabAnimating ? 'pulse 0.3s ease-in-out' : 'none',
            }}
          >
            <PillButton
              label="+NEW"
              isSelected={false}
              onClick={handleNewTab}
            />
          </div>
          {pills.map((pill, index) => (
            <div
              key={pill}
              style={{
                animation: closingPill === pill 
                  ? 'slideOutToRight 0.25s cubic-bezier(0.4, 0, 1, 1) forwards'
                  : isNewTabAnimating && index === pills.length - 1 
                    ? 'slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                    : 'none',
              }}
            >
              <PillButton
                label={pill}
                isSelected={selectedPill === pill}
                onClick={() => setSelectedPill(pill)}
                onClose={(e) => handleClosePill(e, pill)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, pill)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, pill)}
                onDrop={(e) => handleDrop(e, pill)}
                isDragOver={dragOverItem === pill}
                showClose={true}
              />
            </div>
          ))}
        </div>
        
        {/* CSS Animations */}
        <style jsx>{`
          .search-input::placeholder {
            opacity: 0.5;
          }
          
          .search-input:focus::placeholder {
            opacity: 0;
          }
          
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(20px) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          
          @keyframes slideOutToRight {
            0% {
              opacity: 1;
              transform: translateX(0) scale(1);
              max-width: 200px;
            }
            50% {
              opacity: 0.5;
              transform: translateX(10px) scale(0.9);
              max-width: 200px;
            }
            100% {
              opacity: 0;
              transform: translateX(20px) scale(0.7);
              max-width: 0;
              margin-left: 0;
              margin-right: 0;
              padding-left: 0;
              padding-right: 0;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(0.95);
            }
          }
        `}</style>
      </div>
    </nav>
  );
});

TopNav.displayName = 'TopNav';

export default TopNav;

