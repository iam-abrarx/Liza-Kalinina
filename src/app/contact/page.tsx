"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Contact() {
  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col justify-between p-6 md:p-12 lg:p-24 selection:bg-[#111] selection:text-[#F4F4F0]">
      {/* Navbar Minimal */}
      <nav className="w-full flex justify-between items-center text-[var(--color-brand-ink)]">
        <Link href="/" className="flex items-center gap-4 hover:opacity-70 transition-opacity">
          <span className="text-xl md:text-l font-display tracking-[0.15em] md:tracking-[0.2em] uppercase">Elizabeth Kalinina</span>
          <span className="hidden md:block w-px h-8 bg-black/10" />
          <span className="text-xl md:text-l font-display tracking-[0.15em] md:tracking-[0.2em] uppercase">Director of Photography</span>
        </Link>
        <span className="text-sm border-b border-black/20 pb-1">Contact</span>
      </nav>

      {/* Center Typographic Content */}
      <section className="flex flex-col items-center justify-center flex-1 text-center max-w-4xl mx-auto w-full gap-16">
        <div className="flex flex-col items-center gap-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] md:text-xs uppercase tracking-[0.6em] font-normal text-black/40"
          >
            Contact
          </motion.h1>
          
          {/* Location text removed as requested */}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col items-center gap-12"
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-normal">Email</span>
            <a 
              href="mailto:Elisabeth.kalinina@gmail.com" 
              className="text-lg md:text-2xl font-light hover:opacity-50 transition-all duration-300 tracking-wider"
            >
              Elisabeth.kalinina@gmail.com
            </a>
          </div>

          <div className="flex flex-col md:flex-row gap-12 md:gap-24">
            <div className="flex flex-col items-center gap-4">
              <span className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-normal">Phone / WhatsApp</span>
              <a 
                href="https://wa.me/79161767043" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-base md:text-xl font-light hover:opacity-50 transition-all duration-300 tracking-widest"
              >
                +7 916 176-70-43
              </a>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <span className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-normal">Social</span>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <a 
                href="https://instagram.com/lizaleone_dp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-normal hover:opacity-50 transition-colors"
              >
                Instagram
              </a>
              <a 
                href="https://vimeo.com/elizabethkalininadop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-normal hover:opacity-50 transition-colors"
              >
                Vimeo
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="w-full flex justify-center text-xs text-gray-400 tracking-widest uppercase mt-12">
        © {new Date().getFullYear()} Elizabeth Kalinina
      </footer>
    </main>
  );
}
