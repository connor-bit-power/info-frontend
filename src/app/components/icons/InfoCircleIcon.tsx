import React from 'react';

interface InfoCircleIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  width?: number;
  height?: number;
}

export const InfoCircleIcon: React.FC<InfoCircleIconProps> = ({
  className = '',
  size = 'md',
  width,
  height
}) => {
  const getSizeValues = () => {
    if (width && height) return { width, height };

    switch (size) {
      case 'sm': return { width: 14, height: 14 };
      case 'lg': return { width: 24, height: 24 };
      default: return { width: 18, height: 18 };
    }
  };

  const { width: finalWidth, height: finalHeight } = getSizeValues();

  return (
    <svg
      className={className}
      width={finalWidth}
      height={finalHeight}
      viewBox="0 0 18.2988 17.9385"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <rect height="17.9385" opacity="0" width="18.2988" x="0" y="0" />
        <path
          d="M8.96484 17.9297C13.9131 17.9297 17.9297 13.9131 17.9297 8.96484C17.9297 4.0166 13.9131 0 8.96484 0C4.0166 0 0 4.0166 0 8.96484C0 13.9131 4.0166 17.9297 8.96484 17.9297ZM8.96484 16.4355C4.83398 16.4355 1.49414 13.0957 1.49414 8.96484C1.49414 4.83398 4.83398 1.49414 8.96484 1.49414C13.0957 1.49414 16.4355 4.83398 16.4355 8.96484C16.4355 13.0957 13.0957 16.4355 8.96484 16.4355Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
        <path
          d="M7.42676 13.8867L11.0039 13.8867C11.3643 13.8867 11.6455 13.623 11.6455 13.2627C11.6455 12.9199 11.3643 12.6475 11.0039 12.6475L9.91406 12.6475L9.91406 8.17383C9.91406 7.69922 9.67676 7.38281 9.22852 7.38281L7.57617 7.38281C7.21582 7.38281 6.93457 7.65527 6.93457 7.99805C6.93457 8.3584 7.21582 8.62207 7.57617 8.62207L8.5166 8.62207L8.5166 12.6475L7.42676 12.6475C7.06641 12.6475 6.78516 12.9199 6.78516 13.2627C6.78516 13.623 7.06641 13.8867 7.42676 13.8867ZM8.88574 5.92383C9.52734 5.92383 10.0283 5.41406 10.0283 4.77246C10.0283 4.13086 9.52734 3.62109 8.88574 3.62109C8.25293 3.62109 7.74316 4.13086 7.74316 4.77246C7.74316 5.41406 8.25293 5.92383 8.88574 5.92383Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
      </g>
    </svg>
  );
};




