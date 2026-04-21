"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[500] bg-[var(--color-brand-bg)] flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="flex flex-col items-center gap-12 w-full max-w-4xl px-6 md:px-12">
        <div className="overflow-hidden">
          <motion.h1 
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-4xl font-display font-normal tracking-[0.15em] md:tracking-[0.3em] uppercase text-center whitespace-nowrap"
          >
            Elizabeth Kalinina
          </motion.h1>
        </div>
        
        <div className="w-full flex flex-col items-center gap-6">
          <div className="w-full h-[1px] bg-black/5 relative overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 bg-black/20"
            />
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-[12px] md:text-sm font-display font-normal uppercase tracking-[0.3em] text-[var(--color-brand-ink)] logo-name whitespace-nowrap"
          >
            Director of Photography
          </motion.p>
        </div>
      </div>
      
      {/* Cinematic Reveal Bars */}
      <motion.div 
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ delay: 2.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-black/5 origin-top pointer-events-none"
      />
    </motion.div>
  );
}
