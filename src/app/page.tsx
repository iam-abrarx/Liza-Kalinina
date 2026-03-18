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
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[500] bg-[var(--color-brand-bg)] flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="overflow-hidden">
          <motion.h1 
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-display italic tracking-tighter"
          >
            Liza Kalinina
          </motion.h1>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <p className="text-[10px] uppercase tracking-[0.5em] font-medium">Director of Photography</p>
          
          {/* Minimalist Shutter Loader */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 180 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-black/5"
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <div 
                  key={deg}
                  style={{ transform: `rotate(${deg}deg) translateY(-50%)` }}
                  className="absolute top-1/2 left-1/2 w-6 h-[1px] bg-black/10 origin-left"
                />
              ))}
            </motion.div>
            <div className="w-4 h-4 rounded-full border border-black/20" />
          </div>
        </motion.div>
      </div>
      
      {/* Cinematic Reveal Bars */}
      <motion.div 
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ delay: 2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
    return [...projects, ...unlockedProjects].filter((project: any) => {
      const dbCategory = CATEGORY_MAP[activeCategory];
      const projectCat = (project.category || '').toUpperCase();
      const activeCat = activeCategory.toUpperCase();
      const dbCat = (dbCategory || '').toUpperCase();
      
      return projectCat === activeCat || 
             projectCat === dbCat || 
             projectCat === activeCat.replace(/S$/, '') ||
             (activeCat === 'COMMERCIALS' && projectCat === 'COMMERCIAL');
    });
  };
  
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
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
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
      {/* Global modal removed, replaced by inline ProjectCard unlocking */}

      <nav className="fixed top-0 w-full p-6 md:px-12 md:py-8 flex justify-between items-center z-50 text-[var(--color-brand-ink)] bg-[var(--color-brand-bg)]/80 backdrop-blur-xl border-b border-[var(--color-brand-ink)]/5 transition-all duration-500">
        <Link href="/" className="text-xs md:text-sm tracking-[0.3em] uppercase font-bold">Liza Kalinina</Link>
        <Link href="/contact" className="text-xs md:text-sm uppercase tracking-widest hover:opacity-50 transition-opacity">Contact</Link>
      </nav>

      {/* Hero Cover Component */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        <motion.div 
          style={{ 
            y: heroY, 
            opacity: heroOpacity, 
            scale: heroScale
          }}
          className="absolute inset-0 z-0 bg-[var(--color-brand-bg)]"
        />
        
        {/* Massive Editorial Title */}
        <div className="z-10 text-center flex flex-col items-center pointer-events-none px-4">
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span className="text-[var(--color-brand-ink)]/40 text-[10px] sm:text-xs tracking-[0.8em] uppercase font-bold mb-4 ml-4">
              The Works of
            </span>
            <motion.h1 
              className="text-[var(--color-brand-ink)] text-[clamp(3.5rem,15vw,15rem)] font-display italic leading-[0.75] tracking-tighter opacity-90 drop-shadow-[0_20px_50px_rgba(0,0,0,0.05)] select-none cursor-default"
            >
              Liza Kalinina
            </motion.h1>
          </motion.div>
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1 }}
            className="flex flex-col items-center mt-12 gap-8"
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-[var(--color-brand-ink)] text-xs tracking-[0.4em] uppercase font-bold">
                Director of Photography
              </p>
              <p className="text-[var(--color-brand-ink)]/40 text-[9px] tracking-[0.2em] uppercase">
                Based in Paris · Available Worldwide
              </p>
            </div>
            {/* Minimalist Animated Scroll Line */}
            <div className="h-24 w-[1px] bg-gradient-to-b from-[var(--color-brand-ink)]/60 to-transparent animate-pulse delay-700" />
          </motion.div>
        </div>
      </section>

      <section 
        className="relative z-20 bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] pt-24 pb-48 px-6 md:px-12 lg:px-24"
      >
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24 xl:gap-32">
          
          <aside className="md:w-48 shrink-0">
            <div className="sticky top-32 flex flex-row md:flex-col gap-8 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide whitespace-nowrap border-b md:border-b-0 border-black/5 md:border-none -mx-6 px-6 md:mx-0 md:px-0">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className={`flex items-center justify-start md:justify-between shrink-0 w-auto md:w-full group/prem ${cat === "Featured" ? "md:mt-2 md:border-t md:border-current/10 md:pt-4" : ""}`}
                >
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className={`text-left text-lg md:text-xl transition-all duration-500 ${
                      activeCategory === cat
                        ? "text-[var(--color-brand-ink)] font-normal italic"
                        : "text-gray-400 font-light hover:text-gray-600"
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

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-16 md:gap-12 lg:gap-32 border-l-0 md:border-l border-black/5 pl-0 md:pl-16 lg:pl-32">
            {getMatchedProjects().map((project: any) => {
              const isNarrative = activeCategory === "Narrative";
              const mode = activeCategory === "Featured" ? "theatrical" : "editorial";

              if (isNarrative) {
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group border-b border-black/5 py-12 cursor-pointer relative"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 group-hover:text-black transition-colors">
                          {project.year} · {project.role}
                        </span>
                        <h2 className="text-5xl md:text-8xl font-display italic tracking-tighter group-hover:pl-4 transition-all duration-700">
                          {project.title}
                        </h2>
                      </div>
                      <div className="flex flex-col items-start md:items-end text-[10px] uppercase tracking-widest text-gray-500 gap-1">
                        <span>Dir. {project.director}</span>
                        <span>{project.client}</span>
                      </div>
                    </div>

                    <div className="absolute top-1/2 right-32 -translate-y-1/2 w-64 aspect-2-1 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none overflow-hidden rotate-3 group-hover:rotate-0 scale-90 group-hover:scale-100 z-10 shadow-2xl translate-x-12 group-hover:translate-x-0 hidden lg:block">
                      <img src={project.media_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                );
              }

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
            <span className="hidden md:block">Based in Moscow / Worldwide</span>
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
                <h3 className="text-4xl md:text-6xl text-white font-display italic">{selectedProject.title}</h3>
                <p className="text-xl text-white/40 font-display italic">{selectedProject.category} · {selectedProject.year}</p>
                <div className="space-y-6 mt-4">
                  <p className="text-lg text-white/80 leading-relaxed max-w-xl">
                    {selectedProject.description}
                  </p>
                  {selectedProject.long_description && (
                    <p className="text-base text-white/40 leading-relaxed max-w-xl font-light italic">
                      {selectedProject.long_description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end items-end gap-2 text-sm text-white/40">
                <p className="uppercase tracking-[0.3em] font-medium">Director: {selectedProject.director}</p>
                <p className="uppercase tracking-[0.3em] font-medium">DP: {selectedProject.role}</p>
                <p className="uppercase tracking-[0.3em] font-medium opacity-50 mt-4">Production: {selectedProject.production_company}</p>
                {selectedProject.awards && (
                  <p className="text-white/40 italic font-display mt-8 text-right max-w-xs">{selectedProject.awards}</p>
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
      style={{ scale, opacity }}
      className="flex flex-col gap-8"
    >
      {(project.media_url || project.thumbnail_url) && (
        <div 
          className={`relative aspect-2-1 w-full ${mode === 'theatrical' ? 'bg-zinc-900 border border-black/10 shadow-xl' : 'bg-gray-200'} overflow-hidden ${project.is_locked ? '' : 'cursor-pointer group'}`}
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
                src={project.thumbnail_url} 
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
              src={project.thumbnail_url || `https://vumbnail.com/${getVimeoId(project.media_url)}.jpg`} 
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
            <div className={`absolute inset-0 ${mode === 'theatrical' ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent' : 'bg-black/0 group-hover:bg-black/20'} transition-all duration-500 flex flex-col items-center justify-center p-8`}>
             {mode === 'theatrical' ? (
               <span className="opacity-0 group-hover:opacity-100 text-white border border-white/20 rounded-full px-12 py-4 uppercase tracking-[0.4em] text-[10px] transition-all duration-500 transform group-hover:translate-y-0 translate-y-8 backdrop-blur-sm">
                 Screening
               </span>
             ) : (
               <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none p-6 flex flex-col justify-between">
                 {/* Viewfinder Corners */}
                 <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-white/80" />
                 <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-white/80" />
                 <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-white/80" />
                 <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-white/80" />
                 
                 {/* Center Shutter/Aperture - Minimalist */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                   <motion.div 
                     animate={{ 
                       rotate: isCapturing ? 90 : 0,
                       scale: isCapturing ? 0.8 : 1
                     }}
                     transition={{ duration: 0.3, ease: "circOut" }}
                     className="relative w-14 h-14 rounded-full border border-white/20 flex items-center justify-center overflow-hidden"
                   >
                     {/* Shutter Blades - Thinner */}
                     {[0, 60, 120, 180, 240, 300].map((deg) => (
                       <div 
                         key={deg}
                         style={{ transform: `rotate(${deg}deg) translateY(-50%)` }}
                         className="absolute top-1/2 left-1/2 w-7 h-[1px] bg-white/30 origin-left"
                       />
                     ))}
                     <div className="w-5 h-5 rounded-full border border-white/30" />
                     <motion.div 
                       animate={{ opacity: isCapturing ? 1 : 0 }}
                       className="absolute inset-0 bg-white/20"
                     />
                   </motion.div>
                 </div>
                 
                  {/* Project Title Overlay */}
                  <div className="absolute inset-x-0 bottom-12 flex justify-center px-8 z-10 transition-transform duration-700 ease-out translate-y-4 group-hover:translate-y-0">
                    <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-display italic text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                      {project.title}
                    </h3>
                  </div>
                </div>
             )}
          </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:gap-8 max-w-4xl">
        <div className="flex flex-col gap-4">
          <h2 className={`text-4xl md:text-5xl lg:text-7xl ${mode === 'theatrical' ? 'text-[var(--color-brand-ink)] font-display italic tracking-tight' : 'text-[var(--color-brand-ink)]'}`}>
            {project.title}
          </h2>
        </div>

        <div className={`flex flex-col gap-2 text-sm text-gray-500`}>
          
          {/* Mobile Paragraph Layout */}
          <p className="sm:hidden text-xs leading-loose text-gray-500">
            {project.year && project.year.trim() && (
              <span className="inline-block mr-3">
                <span className="uppercase tracking-widest text-[9px] opacity-50 mr-2">Year</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.year}</strong>
              </span>
            )}
            {project.role && project.role.trim() && (
              <span className="inline-block mr-3">
                <span className="uppercase tracking-widest text-[9px] opacity-50 mr-2">Role</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.role}</strong>
              </span>
            )}
            {project.director && project.director.trim() && (
              <span className="inline-block mr-3">
                <span className="uppercase tracking-widest text-[9px] opacity-50 mr-2">Director</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.director}</strong>
              </span>
            )}
            {project.client && project.client.trim() && (
              <span className="inline-block mr-3">
                <span className="uppercase tracking-widest text-[9px] opacity-50 mr-2">Client</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.client}</strong>
              </span>
            )}
            {project.production_company && project.production_company.trim() && (
              <span className="inline-block mr-3">
                <span className="uppercase tracking-widest text-[9px] opacity-50 mr-2">Studio</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.production_company}</strong>
              </span>
            )}
          </p>

          {/* Desktop/Tablet Grid Layout */}
          <div className="hidden sm:flex flex-row flex-wrap gap-8 lg:gap-16 mt-4">
            {project.year && project.year.trim() && (
              <div className="flex flex-col gap-1">
                <span className="uppercase tracking-widest text-[9px] opacity-50">Year</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.year}</strong>
              </div>
            )}
            {project.role && project.role.trim() && (
              <div className="flex flex-col gap-1">
                <span className="uppercase tracking-widest text-[9px] opacity-50">Role</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.role}</strong>
              </div>
            )}
            {project.director && project.director.trim() && (
              <div className="flex flex-col gap-1">
                <span className="uppercase tracking-widest text-[9px] opacity-50">Director</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.director}</strong>
              </div>
            )}
            {project.client && project.client.trim() && (
              <div className="flex flex-col gap-1">
                <span className="uppercase tracking-widest text-[9px] opacity-50">Client</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.client}</strong>
              </div>
            )}
            {project.production_company && project.production_company.trim() && (
              <div className="flex flex-col gap-1">
                <span className="uppercase tracking-widest text-[9px] opacity-50">Studio</span>
                <strong className="font-normal text-[var(--color-brand-ink)]">{project.production_company}</strong>
              </div>
            )}
          </div>

          {project.awards && project.awards.trim() && (
            <div className={`mt-2 sm:mt-6 pt-2 font-normal italic font-display ${mode === 'theatrical' ? 'text-black/30' : 'text-[#b09e8d]'}`}>
              {project.awards}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
