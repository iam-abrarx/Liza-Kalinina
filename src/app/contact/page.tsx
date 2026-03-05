"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Contact() {
  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col justify-between p-6 md:p-12 lg:p-24 selection:bg-[#111] selection:text-[#F4F4F0]">
      {/* Navbar Minimal */}
      <nav className="w-full flex justify-between items-center text-[var(--color-brand-ink)]">
        <Link href="/" className="text-sm tracking-widest uppercase font-medium hover:opacity-70 transition-opacity">
          Liza Kalinina
        </Link>
        <span className="text-sm border-b border-black/20 pb-1">Contact</span>
      </nav>

      {/* Center Typographic Content */}
      <section className="flex flex-col items-center justify-center flex-1 text-center max-w-4xl mx-auto w-full">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-9xl mb-8 -tracking-[0.04em]"
        >
          Get In Touch
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg md:text-2xl font-light text-gray-600 mb-16 italic font-display"
        >
          Worldwide Availability
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <a 
            href="mailto:Elisabeth.kalinina@gmail.com" 
            className="text-xl md:text-3xl font-light hover:italic transition-all duration-300 relative group"
          >
            Elisabeth.kalinina@gmail.com
            <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-black/20 origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-500" />
          </a>
          
          <a 
            href="https://instagram.com/lizaleone_dp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm tracking-[0.2em] uppercase font-medium mt-8 hover:text-gray-500 transition-colors"
          >
            Instagram : @lizaleone_dp
          </a>
        </motion.div>
      </section>

      {/* Footer Minimal */}
      <footer className="w-full flex justify-center text-xs text-gray-400 tracking-widest uppercase mt-12">
        © {new Date().getFullYear()} Liza Kalinina
      </footer>
    </main>
  );
}
