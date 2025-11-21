'use client';

import { useState, ReactNode } from 'react';

interface PillButtonProps {
  label: string | ReactNode;
  isSelected: boolean;
  onClick?: () => void;
  onClose?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  showClose?: boolean;
}

export default function PillButton({ 
  label, 
  isSelected, 
  onClick,
  onClose,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragOver = false,
  showClose = false
}: PillButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    if (onDragStart) onDragStart(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(e);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) onClose(e);
  };

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="rounded-full relative flex-shrink-0"
      style={{
        backgroundColor: isSelected ? '#FFFFFF' : 'rgba(217, 217, 217, 0.1)',
        backdropFilter: isSelected ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: isSelected ? 'none' : 'blur(10px)',
        color: isSelected ? '#000000' : '#FFFFFF',
        paddingTop: '7px',
        paddingBottom: '7px',
        paddingLeft: '21px',
        paddingRight: showClose && isHovered ? '36px' : '21px',
        fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
        border: 'none',
        cursor: draggable ? 'grab' : 'pointer',
        opacity: isDragging ? 0.5 : 1,
        transform: `scale(${isPressed ? 0.95 : isDragOver ? 1.05 : 1})`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDragOver ? '0 0 0 2px rgba(255, 255, 255, 0.3)' : 'none',
      }}
    >
      <span style={{
        display: 'inline-block',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: showClose && isHovered ? 'translateX(-6px)' : 'translateX(0)',
        fontWeight: isSelected ? 500 : 400,
      }}>
        {label}
      </span>
      {showClose && (
        <span
          onClick={handleClose}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          ✕
        </span>
      )}
    </button>
  );
}
