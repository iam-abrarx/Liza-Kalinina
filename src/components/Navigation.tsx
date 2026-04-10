"use client";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/utils";

interface NavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeCategory: string;
  handleCategoryClick: (cat: string) => void;
}

export function Navigation({ mobileMenuOpen, setMobileMenuOpen, activeCategory, handleCategoryClick }: NavigationProps) {
  return (
    <>
      <nav className="fixed top-0 w-full p-4 md:px-12 md:py-6 flex justify-between items-center z-50 text-[var(--color-brand-ink)] bg-white border-b border-black/5">
        <Link href="/" className="flex items-center gap-4">
          <span className="text-sm md:text-base tracking-[0.4em] uppercase logo-name">Elizabeth Kalinina</span>
          <span className="hidden md:block w-px h-4 bg-black/10" />
          <span className="text-sm md:text-base tracking-[0.4em] uppercase text-[var(--color-brand-ink)] logo-name">Director of Photography</span>
        </Link>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-1"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white pt-[70px] px-8 flex flex-col gap-6 md:hidden"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`text-left text-base uppercase tracking-[0.2em] transition-all duration-300 py-2 border-b border-black/5 ${
                  activeCategory === cat
                    ? "text-black font-bold"
                    : "text-gray-500 font-medium"
                }`}
              >
                {cat === "Films" ? (
                  <span className="flex items-center gap-2">
                    {cat} <span className="inline-block w-2 h-2 rounded-full bg-black/20 animate-pulse" />
                  </span>
                ) : cat}
              </button>
            ))}
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-base uppercase tracking-[0.2em] transition-all duration-300 py-2 border-b border-black/5 text-gray-500 font-medium"
            >
              Contact
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
