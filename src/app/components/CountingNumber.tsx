'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface CountingNumberProps {
  number: number;
  decimalPlaces?: number;
  suffix?: string;
  transition?: {
    stiffness?: number;
    damping?: number;
  };
}

export default function CountingNumber({ 
  number, 
  decimalPlaces = 0,
  suffix = '',
  transition = { stiffness: 300, damping: 30 }
}: CountingNumberProps) {
  const spring = useSpring(number, transition);
  const [displayValue, setDisplayValue] = useState(
    decimalPlaces > 0 ? number.toFixed(decimalPlaces) : Math.round(number)
  );
  const previousNumber = useRef(number);

  useEffect(() => {
    if (previousNumber.current !== number) {
      spring.set(number);
      previousNumber.current = number;
    }
  }, [number, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      const formatted = decimalPlaces > 0 
        ? latest.toFixed(decimalPlaces) 
        : Math.round(latest);
      setDisplayValue(formatted);
    });
    
    return () => unsubscribe();
  }, [spring, decimalPlaces]);

  return <motion.span>{displayValue}{suffix}</motion.span>;
}

