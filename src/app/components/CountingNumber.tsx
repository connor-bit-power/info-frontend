'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface CountingNumberProps {
  number: number;
  decimalPlaces?: number;
  transition?: {
    stiffness?: number;
    damping?: number;
  };
}

export default function CountingNumber({ 
  number, 
  decimalPlaces = 0,
  transition = { stiffness: 300, damping: 30 }
}: CountingNumberProps) {
  const spring = useSpring(number, transition);
  const [displayValue, setDisplayValue] = useState(Math.round(number));
  const previousNumber = useRef(number);

  useEffect(() => {
    if (previousNumber.current !== number) {
      spring.set(number);
      previousNumber.current = number;
    }
  }, [number, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    
    return () => unsubscribe();
  }, [spring]);

  return <motion.span>{displayValue}% Chance</motion.span>;
}

