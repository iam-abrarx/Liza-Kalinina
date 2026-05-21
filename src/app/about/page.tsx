"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

interface BioData {
  text: string;
  images: string[];
}

export default function Bio() {
  const [bioData, setBioData] = useState<BioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBio() {
      try {
        const res = await fetch("/api/bio");
        if (res.ok) {
          const data = await res.json();
          setBioData(data);
        }
      } catch (err) {
        console.error("Failed to load bio:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBio();
  }, []);

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const cleanUrl = url.replace(/^\/Elizabeth-Kalinina/, '');
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col items-center justify-center text-[var(--color-brand-ink)]">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-800 animate-spin" />
      </main>
    );
  }

  const text = bioData?.text || "";
  const images = bioData?.images || [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  const focusImage = images[0] || null;
  const otherImages = images.slice(1);

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
                Elizabeth Kalinina – About
              </motion.h1>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-20">
            
            {/* Left Column: Focus Image */}
            {focusImage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="overflow-hidden bg-zinc-100 border border-black/[0.03]"
                >
                  <img 
                    src={getMediaUrl(focusImage)} 
                    alt="Elizabeth Kalinina" 
                    className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-out hover:scale-[1.02]"
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Right Column: Bio Paragraphs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`${focusImage ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-8 text-zinc-900 text-sm md:text-base leading-[1.8] font-serif`}
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              {paragraphs.map((p, idx) => (
                <p key={idx} dangerouslySetInnerHTML={{ __html: p.replace(/Limonov: The Ballad/g, '<span class="italic">Limonov: The Ballad</span>').replace(/Foreign Call \(2026\)/g, '<span class="italic">Foreign Call (2026)</span>') }} />
              ))}
            </motion.div>

          </div>

          {/* Other Images Grid (below) */}
          {otherImages.length > 0 && (
            <div className="border-t border-black/10 pt-16">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-display mb-8"
              >
                Highlights & On Set
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {otherImages.map((src, index) => (
                  <motion.div
                    key={src + index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="aspect-square overflow-hidden bg-zinc-100 border border-black/[0.03]"
                  >
                    <img 
                      src={getMediaUrl(src)} 
                      alt={`Elizabeth Kalinina gallery highlight ${index + 1}`} 
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-out hover:scale-[1.03]"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      <footer className="py-6 px-6 md:px-12 border-t border-black/10 mt-auto">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-black font-display font-normal">
          <span>© 2025 Elizabeth Kalinina</span>
          <div className="flex gap-8">
            <a href="https://www.instagram.com/lizaleone_dp" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Instagram</a>
            <a href="https://vimeo.com/elizabethkalininadop" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Vimeo</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
