'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ArrowRightCircleIcon from '../components/icons/ArrowRightCircleIcon';

export default function WaitPage() {
  const [email, setEmail] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if user is on desktop (screen width >= 1024px)
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Initial check
    checkDevice();

    // Listen for window resize
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
    console.log('Email submitted:', email);
    // You can add your email submission logic here
  };

  // Only render the page content for desktop users
  if (!isDesktop) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: '#242424' }}
      >
        <p className="text-white text-center px-8">
          This page is only available on desktop
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{ backgroundColor: '#242424' }}
    >
      <div className="flex flex-col items-center gap-12 px-8 max-w-2xl w-full">
        {/* GIF Animation */}
        <div className="relative w-48 h-48">
          <Image
            src="/white.gif"
            alt="Loading animation"
            width={192}
            height={192}
            unoptimized
            priority
          />
        </div>

        {/* Text */}
        <p 
          className="text-white text-center"
          style={{
            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          we can&apos;t wait to show you what we&apos;ve got for you
        </p>

        {/* Email Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="relative w-full">
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 pr-16 bg-transparent text-white placeholder-white/50 rounded-full outline-none"
              style={{
                border: '1px solid white',
                fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
              }}
              required
            />
            
            {/* Submit Button with Arrow Circle */}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Submit email"
            >
              <ArrowRightCircleIcon 
                width={40} 
                height={40} 
                circleColor="white"
                arrowColor="#242424"
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


