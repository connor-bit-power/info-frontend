'use client';

import { useEffect, useState } from 'react';
import DesktopHome from './desktop/home/page';
import MobileHome from './mobile/home/page';

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Listen for resize events
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Prevent flash of wrong content during SSR
  if (isMobile === null) {
    return null;
  }

  return isMobile ? <MobileHome /> : <DesktopHome />;
}
