"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Contact() {
  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col selection:bg-[#111] selection:text-[#F4F4F0]">

      <section className="relative z-20 bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] pt-12 md:pt-16 pb-24 px-6 md:px-12 lg:px-24 flex-grow">
        <div className="max-w-6xl mx-auto relative">
          <div className="sticky top-0 z-40 bg-[var(--color-brand-bg)] pt-6 md:pt-8 pb-2 mb-8 md:mb-12">
            {/* Back Button */}
            <div className="mb-4">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-black transition-colors"
              >
                ← Home
              </Link>
            </div>

            {/* Title Header */}
            <div className="border-b border-black/10 pb-4">
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-base md:text-lg font-display font-light uppercase tracking-[0.2em] text-zinc-950"
              >
                Elizabeth Kalinina – Contact
              </motion.h1>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center justify-center text-center py-12 md:py-24 gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-center gap-12"
            >
              <div className="flex flex-col items-center gap-4">
                <span className="text-[9px] uppercase tracking-[0.4em] text-black/60 font-bold">Email</span>
                <a
                  href="mailto:elisabeth.kalinina@gmail.com"
                  className="text-xl md:text-3xl font-display uppercase hover:opacity-50 transition-all duration-300 tracking-[0.15em]"
                >
                  elisabeth.kalinina@gmail.com
                </a>
              </div>

              <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-black/60 font-bold">Phone / WhatsApp</span>
                  <a 
                    href="https://wa.me/33766878452" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg md:text-2xl font-display uppercase hover:opacity-50 transition-all duration-300 tracking-[0.15em]"
                  >
                    +33 7 66 87 84 52
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <span className="text-[9px] uppercase tracking-[0.4em] text-black/60 font-bold">Social</span>
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
          </div>
        </div>
      </section>

      <footer className="py-6 px-6 md:px-12 border-t border-black/10 mt-auto">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-black font-display font-normal">
          <span>© {new Date().getFullYear()} Elizabeth Kalinina</span>
          <div className="flex gap-8">
            <a href="https://www.instagram.com/lizaleone_dp" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Instagram</a>
            <a href="https://vimeo.com/elizabethkalininadop" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Vimeo</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
