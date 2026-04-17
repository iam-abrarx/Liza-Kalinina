"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Components
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProjectCard } from "@/components/ProjectCard";
import { TheaterMode } from "@/components/TheaterMode";

// Hooks & Utils
import { useHydrated } from "@/hooks/useHydrated";
import { CATEGORY_MAP } from "@/lib/utils";
import { Project } from "@/types";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  
  const hasVisited = typeof window !== "undefined" && !!localStorage.getItem("ek_visited");
  const [isLoading, setIsLoading] = useState(!hasVisited);
  const [projects, setProjects] = useState<Project[]>([]);
  const [unlockedProjects, setUnlockedProjects] = useState<Project[]>([]);
  const [activeCategory, setActiveCategory] = useState("Commercials");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Restore unlocked projects from local storage safely
  useEffect(() => {
    if (!hydrated) return;
    
    const saved = localStorage.getItem('unlocked_tickets');
    if (saved) {
      try {
        const tickets = JSON.parse(saved);
        if (Array.isArray(tickets) && tickets.length > 0) {
          fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) {
                const unlocked = data.filter((p: Project) => tickets.includes(p.id));
                setUnlockedProjects(unlocked);
              }
            })
            .catch(err => console.error("Auto-unlock restore failed:", err));
        }
      } catch (e) {
        console.error("Corrupt local storage for tickets:", e);
        localStorage.removeItem('unlocked_tickets');
      }
    }
  }, [hydrated]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getMatchedProjects = () => {
    const dbCategory = CATEGORY_MAP[activeCategory];
    if (!dbCategory) return [];
    
    // Combine public projects and unlocked featured projects
    const allAvailable = [...projects, ...unlockedProjects];
    
    // Deduplicate by ID
    const uniqueProjects = Array.from(new Map(allAvailable.map(p => [p.id, p])).values());

    return uniqueProjects.filter((project: Project) => {
      return (project.category || '').toUpperCase() === dbCategory.toUpperCase();
    });
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setMobileMenuOpen(false);
  };

  const handleEndFilmsSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unlocked_tickets');
    }
    setUnlockedProjects([]);
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedProject]);

  if (!hydrated) return null; // Avoid hydration mismatch on initial render

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col" ref={containerRef}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loader" onComplete={() => { localStorage.setItem("ek_visited", "1"); setIsLoading(false); }} />
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col min-h-screen"
          >
            <Navigation 
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              activeCategory={activeCategory}
              handleCategoryClick={handleCategoryClick}
            />

            <section className="relative z-20 bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] pt-32 md:pt-44 pb-12 px-0 md:px-0 flex-1">
              <div className="max-w-full mx-auto flex flex-col md:flex-row">
                
                <Sidebar 
                  activeCategory={activeCategory}
                  handleCategoryClick={handleCategoryClick}
                  unlockedProjectsCount={unlockedProjects.length}
                  handleEndFilmsSession={handleEndFilmsSession}
                />

                {/* Projects Grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8 md:gap-y-10"
                  >
                    {getMatchedProjects().map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        mode={activeCategory === "Films" ? "theatrical" : "editorial"}
                        onSelect={setSelectedProject}
                        onUnlock={(unlocked) => setUnlockedProjects(prev => [...prev, unlocked])} 
                      />
                    ))}

                    {getMatchedProjects().length === 0 && (
                      <div className="py-32 text-center italic font-display text-xl text-gray-400">
                        No projects loaded for {activeCategory} yet.
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>

            <footer className="py-6 px-6 md:px-12 border-t border-black/10">
              <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-black font-display font-normal">
                <span>© 2025 Elizabeth Kalinina</span>
                <div className="flex gap-8">
                  <a href="https://www.instagram.com/lizaleone_dp" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Instagram</a>
                  <a href="https://vimeo.com/elizabethkalininadop" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Vimeo</a>
                </div>
              </div>
            </footer>

            <TheaterMode 
              project={selectedProject} 
              onClose={() => setSelectedProject(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
