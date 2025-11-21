import React from 'react';

export default function ChevronLeftIcon({ width = 24, height = 24, color = "white", opacity = 0.85, ...props }: React.SVGProps<SVGSVGElement> & { width?: number, height?: number, color?: string, opacity?: number }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 11.1973 15.2666" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M0 7.62891C0 7.84863 0.0791016 8.04199 0.246094 8.20898L7.21582 15.0205C7.36523 15.1787 7.55859 15.2578 7.78711 15.2578C8.24414 15.2578 8.5957 14.915 8.5957 14.458C8.5957 14.2295 8.49902 14.0361 8.3584 13.8867L1.95996 7.62891L8.3584 1.37109C8.49902 1.22168 8.5957 1.01953 8.5957 0.799805C8.5957 0.342773 8.24414 0 7.78711 0C7.55859 0 7.36523 0.0791016 7.21582 0.228516L0.246094 7.04883C0.0791016 7.20703 0 7.40918 0 7.62891Z" 
        fill={color} 
        fillOpacity={opacity}
      />
    </svg>
  );
}

