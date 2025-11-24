import React from 'react';

interface IconProps {
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

export default function ArrowUpIcon({ width = 14, height = 14, color = 'white', className }: IconProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 14.3525 14.3525"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M13.9834 13.2891C13.9834 12.9375 13.8252 12.6562 13.6406 12.2871L8.16504 1.00195C7.7959 0.246094 7.45312 0.00878906 6.9873 0.00878906C6.52148 0.00878906 6.1875 0.246094 5.81836 1.00195L0.333984 12.2871C0.158203 12.665 0 12.9463 0 13.2979C0 13.9482 0.492188 14.3525 1.25684 14.3525L12.7178 14.3438C13.4824 14.3438 13.9834 13.9395 13.9834 13.2891Z"
                fill={color}
            />
        </svg>
    );
}
