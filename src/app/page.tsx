"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, X, Plus, LogOut } from "lucide-react";

const CATEGORIES = [
  "Commercials",
  "Music Videos",
  "Narrative",
  "Documentaries",
  "Stills",
  "Featured",
];

const CATEGORY_MAP: Record<string, string> = {
  "Commercials": "COMMERCIAL",
  "Music Videos": "MUSIC_VIDEO",
  "Narrative": "NARRATIVE",
  "Documentaries": "DOCUMENTARY",
  "Fashion": "FASHION",
  "Stills": "STILLS",
  "Featured": "FEATURED"
};

const getVimeoId = (url: string) => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const getMediaUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  // Remove legacy prefix if it exists
  const cleanUrl = url.replace(/^\/Liza-Kalinina/, '');
  // Ensure it starts with /
  return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
};


function LoadingScreen({ onComplete }: { onComplete: () => void }) {
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
      <div className="flex flex-col items-center gap-12 w-full max-w-md px-12">
        <div className="overflow-hidden">
          <motion.h1 
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl font-display italic tracking-[0.3em] uppercase whitespace-nowrap"
          >
            Liza Kalinina
          </motion.h1>
        </div>
        
        <div className="w-full flex flex-col items-center gap-6">
          {/* Minimalist Loading Bar */}
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
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-[9px] uppercase tracking-[0.6em] font-medium"
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

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [unlockedProjects, setUnlockedProjects] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Commercials");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [hasPlayedTadam, setHasPlayedTadam] = useState(false);

  const getMatchedProjects = () => {
    const dbCategory = CATEGORY_MAP[activeCategory];
    if (!dbCategory) return [];
    
    return [...projects, ...unlockedProjects].filter((project: any) => {
      return (project.category || '').toUpperCase() === dbCategory.toUpperCase();
    });
  };
  
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

  const handleCategoryClick = (cat: string) => {
    if (cat === "Featured") {
      playTadam();
      setActiveCategory("Featured");
    } else {
      setActiveCategory(cat);
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  const playTadam = () => {
    // Sound removed as requested
    return;
  };


  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]" ref={containerRef}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loader" onComplete={() => setIsLoading(false)} />
        ) : (
          <motion.div 
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
      {/* Global modal removed, replaced by inline ProjectCard unlocking */}

      <nav className="fixed top-0 w-full p-4 md:px-12 md:py-6 flex justify-between items-center z-50 text-[var(--color-brand-ink)] bg-white border-b border-black/5 pointer-events-none">
        <Link href="/" className="text-xs md:text-sm tracking-[0.3em] uppercase font-bold pointer-events-auto">Liza Kalinina</Link>
        <Link href="/contact" className="text-xs md:text-sm uppercase tracking-widest hover:opacity-50 transition-opacity pointer-events-auto">Contact</Link>
      </nav>


      <section 
        className="relative z-20 bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] pt-44 pb-48 px-0 md:px-0"
      >
        <div className="max-w-full mx-auto flex flex-col md:flex-row">
          
          <aside className="md:w-64 shrink-0 sticky top-0 md:relative z-30 bg-[var(--color-brand-bg)] px-6 pt-8 pb-4 md:pt-0">
            <div className="md:sticky md:top-32 flex flex-row md:flex-col gap-12 md:gap-8 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide whitespace-nowrap">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className={`flex items-center justify-start md:justify-between shrink-0 w-auto md:w-full group/prem ${cat === "Featured" ? "md:mt-4 md:border-t md:border-current/10 md:pt-8" : ""}`}
                >
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className={`text-left text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                      activeCategory === cat
                        ? "text-[var(--color-brand-ink)] font-bold"
                        : "text-gray-400 font-medium hover:text-gray-600"
                    }`}
                  >
                    {cat === "Featured" ? (
                      <span className="flex items-center gap-2">
                         {cat} <span className="inline-block w-2 h-2 rounded-full bg-black/20 transition-colors animate-pulse" />
                      </span>
                    ) : (
                      cat
                    )}
                  </button>
                  
                  {cat === "Featured" && unlockedProjects.length > 0 && activeCategory === "Featured" && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        localStorage.removeItem('unlocked_tickets');
                        setUnlockedProjects([]);
                      }}
                      className="p-2 hover:bg-black/5 rounded-full transition-all text-black/40"
                      title="End Featured Session"
                    >
                      <LogOut size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </aside>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-white">
            {getMatchedProjects().map((project: any) => {
              const mode = activeCategory === "Featured" ? "theatrical" : "editorial";

              return (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  mode={mode} 
                  onSelect={setSelectedProject}
                  onUnlock={(unlockedProject) => {
                    setUnlockedProjects(prev => {
                      if (prev.find(p => p.id === unlockedProject.id)) return prev;
                      return [...prev, unlockedProject];
                    });
                  }} 
                />
              );
            })}
            

            {getMatchedProjects().length === 0 && (
              <div className="py-32 text-center italic font-display text-xl text-gray-400">
                No projects loaded for {activeCategory} yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cinematic Footer Section */}
      <footer className="py-8 px-6 md:px-12 lg:px-24 border-t border-black/5">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center">

          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 mt-8 opacity-30 text-[9px] uppercase tracking-[0.5em] font-medium border-t border-black/5 pt-12">
            <div className="flex gap-12">
              <Link href="#" className="hover:opacity-100 transition-opacity">Instagram</Link>
              <Link href="#" className="hover:opacity-100 transition-opacity">Vimeo</Link>
              <Link href="#" className="hover:opacity-100 transition-opacity">IMDb</Link>
            </div>
            <span>© 2026 Liza Kalinina · All Rights Reserved</span>
            <span className="hidden md:block">Based in Paris / Worldwide</span>
          </div>
        </div>
      </footer>

      {/* Theater Mode Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-start overflow-y-auto bg-black/95 py-12 px-4 md:px-12 lg:px-24 scrollbar-hide"
          >
            {/* Ultra-Dramatic Blur Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-[80px] -z-10"
              onClick={() => setSelectedProject(null)}
            />

            <button 
              onClick={() => setSelectedProject(null)}
              className="fixed top-8 right-8 md:top-12 md:right-12 text-white/50 hover:text-white transition-colors z-[210] bg-black/20 p-2 rounded-full backdrop-blur-md"
            >
              <X size={32} strokeWidth={1} />
            </button>

            <div className="w-full max-w-5xl flex flex-col items-center gap-12">
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full aspect-video shadow-2xl z-[205] group"
              >
              {/* Ambient Glow / Back-lighting */}
              <div className="absolute inset-0 -z-10 translate-y-4 scale-110 blur-[100px] bg-white/5 opacity-50 transition-opacity duration-1000" />
              
              <div className="relative w-full h-full bg-black overflow-hidden">
                {selectedProject.category === 'FEATURED' && (
                  <div className="absolute top-8 left-8 z-[210] flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white drop-shadow-md">Featured Now</span>
                  </div>
                )}

                {getVimeoId(selectedProject.media_url) ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${getVimeoId(selectedProject.media_url)}?autoplay=1&title=0&byline=0&portrait=0`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : getMediaUrl(selectedProject.media_url).match(/\.(mp4|webm|ogg|mov)$|^blob:|^data:video/i) ? (
                  <video 
                    src={getMediaUrl(selectedProject.media_url)} 
                    autoPlay 
                    loop 
                    controls
                    playsInline
                     className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={getMediaUrl(selectedProject.media_url)} 
                    alt={selectedProject.title}
                     className="w-full h-full object-contain"
                  />
                )}
              </div>
            </motion.div>

            {/* Gallery Section for Detailed View */}
            {selectedProject.gallery && selectedProject.gallery.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-5xl flex flex-col gap-8 mt-12"
              >
                <div className="flex justify-between items-baseline">
                  <h4 className="text-white/40 text-[10px] uppercase tracking-[0.5em] font-bold">Behind the Frames</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProject.gallery.map((img: string, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="aspect-video bg-zinc-900 overflow-hidden"
                    >
                      <img src={getMediaUrl(img)} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative z-[205] w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-12 pb-32"
            >
              <div className="flex flex-col gap-4">
                <h3 className="text-xl md:text-2xl text-white font-display italic leading-tight">{selectedProject.title}</h3>
                <p className="text-[10px] text-white/30 font-display tracking-[0.4em] uppercase">{selectedProject.category} · {selectedProject.year}</p>
                <div className="space-y-4 mt-6">
                  <p className="text-[11px] md:text-xs text-white/60 leading-relaxed max-w-lg font-light">
                    {selectedProject.description}
                  </p>
                  {selectedProject.long_description && (
                    <p className="text-[10px] text-white/30 leading-relaxed max-w-lg font-light italic">
                      {selectedProject.long_description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end items-end gap-1 text-[9px] text-white/20">
                <p className="uppercase tracking-[0.4em] font-medium">Director: {selectedProject.director}</p>
                <p className="uppercase tracking-[0.4em] font-medium">DP: {selectedProject.role}</p>
                <p className="uppercase tracking-[0.4em] font-medium opacity-50 mt-1">Production: {selectedProject.production_company}</p>
                {selectedProject.awards && (
                  <p className="text-white/20 italic font-display mt-4 text-right max-w-xs text-[10px]">{selectedProject.awards}</p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )}
</AnimatePresence>
    </main>
  );
}

function ProjectCard({ project, mode, onSelect, onUnlock }: { project: any, mode: string, onSelect: (p: any) => void, onUnlock?: (p: any) => void }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.8, 1, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0]);

  const [isCapturing, setIsCapturing] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockCode) return;
    setIsUnlocking(true);
    setUnlockError("");

    try {
      const res = await fetch('/api/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passCode: unlockCode })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.project && onUnlock) {
          onUnlock(data.project);
          
          // Save to local storage
          const current = JSON.parse(localStorage.getItem('unlocked_tickets') || '[]');
          if (!current.includes(unlockCode)) {
            localStorage.setItem('unlocked_tickets', JSON.stringify([...current, unlockCode]));
          }
          
          // Immediately open the unlocked project in theater mode
          onSelect(data.project);
          
          setUnlockCode("");
          return;
        }
      }
      throw new Error("Validation failed");
    } catch (error) {
      setUnlockError("Invalid Code");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleProjectClick = async () => {
    if (mode === 'theatrical') {
      onSelect(project);
      return;
    }

    setIsCapturing(true);
    // Simulate shutter speed
    await new Promise(resolve => setTimeout(resolve, 400));
    onSelect(project);
    setIsCapturing(false);
  };

  return (
    <motion.article 
      ref={ref}
      className="relative flex flex-col"
    >
      {(project.media_url || project.thumbnail_url) && (
        <div 
          className={`relative aspect-2-1 w-full ${mode === 'theatrical' ? 'bg-zinc-900 border border-black/10 shadow-xl' : 'bg-white'} overflow-hidden ${project.is_locked ? '' : 'cursor-pointer group'}`}
          onClick={project.is_locked ? undefined : handleProjectClick}
          onMouseEnter={(e) => {
            if (project.is_locked) return;
            const video = e.currentTarget.querySelector('video');
            if (video) video.play().catch(() => {});
          }}
          onMouseLeave={(e) => {
            if (project.is_locked) return;
            const video = e.currentTarget.querySelector('video');
            if (video) {
              video.pause();
              video.currentTime = 0;
            }
          }}
        >
          {project.is_locked ? (
            <>
              <img 
                src={getMediaUrl(project.thumbnail_url)} 
                alt={project.title}
                className="w-full h-full object-cover blur-2xl scale-110 opacity-50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                <form 
                  onSubmit={handleUnlockSubmit}
                  className="w-full max-w-sm flex flex-col items-center gap-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Lock size={32} className="text-white/80 animate-pulse" />
                  <div className="relative w-full">
                    <input 
                      type="password"
                      placeholder="Enter Access Code"
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 focus:border-white focus:bg-white/10 rounded-full py-4 text-center text-lg tracking-[0.2em] font-mono outline-none transition-all uppercase placeholder:text-white/30 text-white"
                    />
                    {unlockError && (
                      <p className="absolute -bottom-6 inset-x-0 text-red-300 text-[10px] text-center uppercase tracking-widest font-bold">
                        {unlockError}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={isUnlocking}
                    className="flex items-center gap-2 border border-white/20 hover:bg-white hover:text-black text-white px-8 py-3 rounded-full transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isUnlocking ? "Unlocking..." : "Unlock"}
                  </button>
                </form>
              </div>
            </>
          ) : getVimeoId(project.media_url) ? (
            <img 
              src={getMediaUrl(project.thumbnail_url) || `https://vumbnail.com/${getVimeoId(project.media_url)}.jpg`} 
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : project.media_url?.match(/\.(mp4|webm|ogg|mov)/i) || project.media_url?.startsWith('blob:') || project.media_url?.startsWith('data:video') ? (
            <video 
              src={getMediaUrl(project.media_url)} 
              poster={project.thumbnail_url ? getMediaUrl(project.thumbnail_url) : undefined}
              muted 
              loop 
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={getMediaUrl(project.thumbnail_url || project.media_url)} 
              alt={project.title}
              className="w-full h-full object-cover"
            />
          )}
          {!project.is_locked && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-end justify-start p-8 pb-10">
              <h3 className="text-white text-[10px] md:text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0 text-left tracking-[0.3em] uppercase leading-relaxed">
                {project.title}
              </h3>
            </div>
          )}
        </div>
      )}
    </motion.article>
  );
}
