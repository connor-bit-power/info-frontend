'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import PillButton from '../../components/PillButton';

export type ComponentType = 'news' | 'chart' | 'calendar';

interface TopNavProps {
  isDarkMode?: boolean;
  setIsDarkMode?: (isDark: boolean) => void;
  onAddComponent?: (type: ComponentType) => void;
}

export interface TopNavRef {
  focusSearch: () => void;
}

const TopNav = forwardRef<TopNavRef, TopNavProps>(({ isDarkMode, setIsDarkMode, onAddComponent }: TopNavProps = {}, ref) => {
  const [selectedPill, setSelectedPill] = useState<ComponentType>('news');
  const [searchValue, setSearchValue] = useState<string>('');
  const [pills, setPills] = useState<ComponentType[]>(['news', 'chart', 'calendar']);
  const [draggedItem, setDraggedItem] = useState<ComponentType | null>(null);
  const [dragOverItem, setDragOverItem] = useState<ComponentType | null>(null);
  const [isNewTabAnimating, setIsNewTabAnimating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Expose focusSearch method to parent component
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
    }
  }));

  const handlePillClick = (type: ComponentType) => {
    setSelectedPill(type);
    setIsNewTabAnimating(true);
    onAddComponent?.(type);
    setTimeout(() => setIsNewTabAnimating(false), 300);
  };

  const getComponentLabel = (type: ComponentType): string => {
    switch (type) {
      case 'news':
        return 'News';
      case 'chart':
        return 'Chart';
      case 'calendar':
        return 'Calendar';
      default:
        return type;
    }
  };

  const handleDragStart = (e: React.DragEvent, pill: ComponentType) => {
    setDraggedItem(pill);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, pill: ComponentType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem !== pill) {
      setDragOverItem(pill);
    }
  };

  const handleDrop = (e: React.DragEvent, targetPill: ComponentType) => {
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

        {/* Pill Buttons - Component Types */}
        <div 
          className="flex gap-3"
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {pills.map((pill) => (
            <div
              key={pill}
              style={{
                animation: isNewTabAnimating && selectedPill === pill
                  ? 'pulse 0.3s ease-in-out'
                  : 'none',
              }}
            >
              <PillButton
                label={getComponentLabel(pill)}
                isSelected={selectedPill === pill}
                onClick={() => handlePillClick(pill)}
                showClose={false}
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

