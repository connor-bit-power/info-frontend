'use client';

import { useState, useRef, useEffect } from 'react';
import PillButton from '../app/components/PillButton';

export interface Category {
  id: string;
  label: string;
  icon?: string;
  tagIds?: number[];
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', tagIds: [] },
  
  // Sports - Main category and sub-categories
  { id: 'sports', label: 'Sports', tagIds: [1, 450, 100351, 745, 3420, 899, 100350, 279, 28, 64] },
  { id: 'nfl', label: 'NFL', tagIds: [450] },
  { id: 'cfb', label: 'College Football', tagIds: [100351] },
  { id: 'nba', label: 'NBA', tagIds: [745, 28] },
  { id: 'mlb', label: 'MLB', tagIds: [3420] },
  { id: 'nhl', label: 'NHL', tagIds: [899] },
  { id: 'soccer', label: 'Soccer', tagIds: [100350, 82] },
  { id: 'mma', label: 'UFC', tagIds: [279] },
  { id: 'esports', label: 'Esports', tagIds: [64] },
  
  // Main categories
  { id: 'politics', label: 'Politics', tagIds: [2, 400] },
  { id: 'crypto', label: 'Crypto', tagIds: [21] },
  { id: 'business', label: 'Business', tagIds: [107] },
  { id: 'finance', label: 'Finance', tagIds: [120, 600] },
  { id: 'earnings', label: 'Earnings', tagIds: [1013] },
  { id: 'economy', label: 'Economy', tagIds: [100328] },
  { id: 'culture', label: 'Culture', tagIds: [596] },
  { id: 'entertainment', label: 'Entertainment', tagIds: [100, 1000] },
  { id: 'science', label: 'Science', tagIds: [74] },
  { id: 'news', label: 'News', tagIds: [198] },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  isDarkMode?: boolean;
}

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange,
  isDarkMode = true 
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCategoryObj = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)}>
        <PillButton
          label={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{selectedCategoryObj.label}</span>
              <span style={{ 
                fontSize: '10px', 
                marginLeft: '2px',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>
                ▼
              </span>
            </span>
          }
          isSelected={false}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '180px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                backgroundColor: selectedCategory === category.id 
                  ? 'rgba(46, 92, 255, 0.2)' 
                  : 'transparent',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontWeight: selectedCategory === category.id ? 600 : 400,
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{category.label}</span>
              {selectedCategory === category.id && (
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

