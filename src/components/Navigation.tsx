"use client";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/utils";

interface NavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeCategory?: string;
  handleCategoryClick?: (cat: string) => void;
}

export function Navigation({
  mobileMenuOpen,
  setMobileMenuOpen,
  activeCategory,
  handleCategoryClick
}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isContactPage = pathname === "/contact";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onCategoryClick = (cat: string) => {
    if (handleCategoryClick) {
      handleCategoryClick(cat);
    } else {
      router.push("/");
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 w-full p-4 md:px-12 md:py-6 flex justify-between items-center z-50 text-[var(--color-brand-ink)] bg-white border-b border-black/5">
        <Link href="/" className="flex items-center gap-3 md:gap-4 hover:opacity-70 transition-opacity">
          <span className={`font-display font-normal uppercase leading-tight transition-all duration-300 md:text-sm md:tracking-[0.2em] ${scrolled ? "text-[10px] tracking-[0.08em]" : "text-xs tracking-[0.12em]"}`}>
            <span className="md:hidden">Elizabeth<br />Kalinina</span>
            <span className="hidden md:inline">Elizabeth Kalinina</span>
          </span>
          <span className={`w-px bg-black/10 md:hidden transition-all duration-300 ${scrolled ? "h-5" : "h-6"}`} />
          <span className="hidden md:block w-px h-8 bg-black/10" />
          <span className={`font-display font-normal uppercase leading-tight transition-all duration-300 md:text-sm md:tracking-[0.2em] ${scrolled ? "text-[10px] tracking-[0.08em]" : "text-xs tracking-[0.12em]"}`}>
            <span className="md:hidden">Director of<br />Photography</span>
            <span className="hidden md:inline">Director of Photography</span>
          </span>
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
            className="fixed inset-0 z-40 bg-white pt-[120px] px-8 flex flex-col gap-6 md:hidden"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryClick(cat)}
                className={`text-left text-base uppercase tracking-[0.2em] transition-all duration-300 py-2 border-b border-black/5 ${
                  activeCategory === cat
                    ? "text-black font-normal"
                    : "text-gray-500 font-normal"
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
              className={`text-left text-base uppercase tracking-[0.2em] transition-all duration-300 py-2 border-b border-black/5 ${
                isContactPage ? "text-black font-normal" : "text-gray-500 font-normal"
              }`}
            >
              Contact
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
