'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  label: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, label, suffix = '', duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState('0');

  // Extract number from value (e.g., "99.9%" -> 99.9, "10K+" -> 10000)
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const isDecimal = value.includes('.');
  const hasK = value.includes('K');
  const targetValue = hasK ? numericValue * 1000 : numericValue;

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(targetValue);
    }
  }, [isInView, targetValue, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (hasK) {
        const kValue = latest / 1000;
        setDisplayValue(isDecimal ? kValue.toFixed(1) : Math.floor(kValue).toString());
      } else if (isDecimal) {
        setDisplayValue(latest.toFixed(1));
      } else {
        setDisplayValue(Math.floor(latest).toString());
      }
    });

    return unsubscribe;
  }, [springValue, hasK, isDecimal]);

  // Get suffix from original value (%, K+, etc.)
  const valueSuffix = value.match(/[^0-9.]+$/)?.[0] || suffix;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
      className="relative group"
    >
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative"
      >
        {/* Glow effect on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative bg-card dark:bg-[#0F172A]/80 backdrop-blur-sm rounded-xl p-6 border border-border dark:border-gray-800/50">
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {displayValue}
              {valueSuffix}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground dark:text-gray-400">
              {label}
            </p>
          </div>

          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-blue-500/30"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
