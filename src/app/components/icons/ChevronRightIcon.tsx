import React from 'react';

interface ChevronRightIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  width?: number;
  height?: number;
}

export const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({ 
  className = '', 
  size = 'md',
  width, 
  height 
}) => {
  const getSizeValues = () => {
    if (width && height) return { width, height };
    
    switch (size) {
      case 'sm': return { width: 8, height: 12 };
      case 'lg': return { width: 14, height: 20 };
      default: return { width: 10, height: 15 };
    }
  };
  
  const { width: finalWidth, height: finalHeight } = getSizeValues();
  return (
    <svg 
      className={className}
      width={finalWidth} 
      height={finalHeight} 
      viewBox="0 0 10.4766 15.2666" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <rect height="15.2666" opacity="0" width="10.4766" x="0" y="0"/>
        <path 
          d="M10.4766 7.62891C10.4766 7.40918 10.3887 7.20703 10.2217 7.04883L3.26074 0.228516C3.10254 0.0791016 2.90918 0 2.68066 0C2.23242 0 1.88086 0.342773 1.88086 0.799805C1.88086 1.01953 1.96875 1.22168 2.10938 1.37109L8.50781 7.62891L2.10938 13.8867C1.96875 14.0361 1.88086 14.2295 1.88086 14.458C1.88086 14.915 2.23242 15.2578 2.68066 15.2578C2.90918 15.2578 3.10254 15.1787 3.26074 15.0205L10.2217 8.20898C10.3887 8.04199 10.4766 7.84863 10.4766 7.62891Z" 
          fill="white" 
          fillOpacity="0.85"
        />
      </g>
    </svg>
  );
};
