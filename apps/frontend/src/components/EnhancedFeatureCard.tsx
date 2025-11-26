'use client';

import { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface EnhancedFeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
  href?: string;
}

export function EnhancedFeatureCard({
  icon,
  title,
  description,
  gradient,
  delay = 0,
  href,
}: EnhancedFeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 50, scale: 0.9 }
      }
      transition={{
        duration: 0.6,
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      className="h-full group"
    >
      <motion.div
        whileHover={{ y: -10, transition: { duration: 0.3 } }}
        className="relative h-full"
      >
        {/* Animated glow */}
        <motion.div
          className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative bg-card dark:bg-[#0F172A] rounded-xl border border-border dark:border-gray-800/50 overflow-hidden h-full flex flex-col">
          {/* Top gradient bar */}
          <motion.div
            className={`h-1 w-full bg-gradient-to-r ${gradient}`}
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
            style={{ transformOrigin: 'left' }}
          />

          <div className="p-6 flex-1 flex flex-col">
            {/* Icon container */}
            <motion.div
              className="relative mb-6"
              whileHover={{
                scale: 1.1,
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5 },
              }}
            >
              <div className="flex justify-center items-center w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 dark:from-gray-800 dark:to-gray-800/50 relative overflow-hidden group-hover:shadow-lg transition-shadow">
                {/* Icon glow */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                />
                <div className="relative z-10">{icon}</div>
              </div>

              {/* Floating particles around icon */}
              <motion.div
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`}
                animate={{
                  y: [-5, 5, -5],
                  x: [-2, 2, -2],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-3 text-foreground dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
              {title}
            </h3>

            <p className="text-muted-foreground dark:text-gray-400 mb-4 flex-1">
              {description}
            </p>

            {/* Learn more link */}
            {href && (
              <motion.a
                href={href}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 group/link"
                whileHover={{ x: 5 }}
              >
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </motion.a>
            )}
          </div>

          {/* Animated border on hover */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-500/30 pointer-events-none transition-colors duration-300"
            initial={false}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
