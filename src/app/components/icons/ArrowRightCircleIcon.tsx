import React from 'react';

interface IconProps {
    width?: number;
    height?: number;
    arrowColor?: string;
    circleColor?: string;
    className?: string;
}

export default function ArrowRightCircleIcon({ 
    width = 40, 
    height = 40, 
    arrowColor = '#242424',
    circleColor = 'white',
    className 
}: IconProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Circle background */}
            <circle cx="20" cy="20" r="20" fill={circleColor} />
            
            {/* Arrow pointing right */}
            <path
                d="M14 20H26M26 20L21 15M26 20L21 25"
                stroke={arrowColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


