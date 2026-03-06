"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, X, Plus } from "lucide-react";
import { DUMMY_PROJECTS, DUMMY_PASSES } from "@/data/dummy";

const CATEGORIES = [
  "Commercials",
  "Music Videos",
  "Narrative",
  "Fashion",
  "Stills",
  "Premiere",
];

const CATEGORY_MAP: Record<string, string> = {
  "Commercials": "COMMERCIAL",
  "Music Videos": "MUSIC_VIDEO",
  "Narrative": "NARRATIVE",
  "Fashion": "FASHION",
  "Stills": "STILLS",
  "Premiere": "PREMIERE"
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [unlockedProjects, setUnlockedProjects] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Commercials");
  const [showPremiereModal, setShowPremiereModal] = useState(false);
  const [ticketPass, setTicketPass] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [premiereError, setPremiereError] = useState("");
  const [hasPlayedTadam, setHasPlayedTadam] = useState(false);
  
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.log("Using dummy projects fallback");
      setProjects(DUMMY_PROJECTS);
    }
  };

  useEffect(() => {
    fetchProjects();
    
    // Recovery logic for persistent session
    const savedTickets = JSON.parse(localStorage.getItem('unlocked_tickets') || '[]');
    if (savedTickets.length > 0) {
      savedTickets.forEach((code: string) => validatePass(code, true));
    }
  }, []);

  const validatePass = async (code: string, isSilent: boolean = false) => {
    if (!code) return;
    if (!isSilent) setIsValidating(true);
    setPremiereError("");

    try {
      const res = await fetch('/api/premiere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passCode: code })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          handleSuccessfulValidation(data.project, code, isSilent);
          return;
        }
      }
      throw new Error("Validation failed");
    } catch (error) {
      // Static Fallback
      const pass = DUMMY_PASSES.find(p => p.pass_code.toLowerCase() === code.toLowerCase());
      if (pass) {
        const project = DUMMY_PROJECTS.find(p => p.id === pass.linked_project_id);
        if (project) {
          handleSuccessfulValidation(project, code, isSilent);
          return;
        }
      }
      if (!isSilent) setPremiereError("Invalid Ticket Pass");
    } finally {
      if (!isSilent) setIsValidating(false);
    }
  };

  const handleSuccessfulValidation = (project: any, code: string, isSilent: boolean) => {
    setUnlockedProjects(prev => {
      if (prev.find(p => p.id === project.id)) return prev;
      return [...prev, project];
    });

    if (!isSilent) {
      const current = JSON.parse(localStorage.getItem('unlocked_tickets') || '[]');
      if (!current.includes(code)) {
        localStorage.setItem('unlocked_tickets', JSON.stringify([...current, code]));
      }
      setActiveCategory("Premiere");
      setShowPremiereModal(false);
      setTicketPass("");
    }
  };

  const handleTicketSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await validatePass(ticketPass);
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const playTadam = () => {
    if (hasPlayedTadam) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'); // A deep cinematic impact
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Catch autoplay blocks
    setHasPlayedTadam(true);
  };

  const handleCategoryClick = (cat: string) => {
    if (cat === "Premiere") {
      playTadam();
      // If we already have unlocked content, just show the tab.
      if (unlockedProjects.length > 0) {
        setActiveCategory("Premiere");
      } else {
        setShowPremiereModal(true);
      }
    } else {
      setActiveCategory(cat);
      setShowPremiereModal(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]" ref={containerRef}>
      
      {/* Dynamic Premiere Gate Modal */}
      <AnimatePresence>
        {showPremiereModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 text-white"
          >
            <button 
              onClick={() => setShowPremiereModal(false)}
              className="absolute top-8 right-8 md:top-12 md:right-12 text-white/50 hover:text-white transition-colors"
            >
              <X size={32} strokeWidth={1} />
            </button>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-md w-full text-center flex flex-col items-center gap-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-6">
                <Lock size={48} strokeWidth={1} className="mx-auto text-red-600 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-display italic">Premiere Access</h2>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
                  Enter your unique ticket pass to unlock private screenings and confidential project treatments.
                </p>
              </div>

              <form onSubmit={handleTicketSubmit} className="w-full flex flex-col gap-4">
                <div className="relative w-full">
                  <input 
                    type="text"
                    placeholder="Enter Secret Pass Code"
                    value={ticketPass}
                    onChange={(e) => setTicketPass(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-white py-6 text-center text-2xl tracking-[0.3em] font-mono outline-none transition-colors uppercase placeholder:text-white/10"
                    autoFocus
                  />
                  {premiereError && (
                    <p className="absolute -bottom-8 inset-x-0 text-red-500 text-[10px] uppercase tracking-widest font-bold">
                      {premiereError}
                    </p>
                  )}
                </div>
                
                <button 
                  type="submit"
                  disabled={isValidating}
                  className="mt-8 flex items-center justify-between w-full border border-white/20 hover:bg-white hover:text-black px-8 py-4 rounded-full transition-all group disabled:opacity-50"
                >
                  <span className="text-sm uppercase tracking-widest font-medium">
                    {isValidating ? "Validating Pass..." : "Validate Ticket"}
                  </span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            scale: useTransform(scrollYProgress, [0, 1], [1, 1.05]) 
          }}
          className="absolute inset-0 z-0 bg-[var(--color-brand-bg)]"
        />
        
        {/* Massive Editorial Title */}
        <div className="z-10 text-center flex flex-col items-center pointer-events-none px-4">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span className="text-[var(--color-brand-ink)]/40 text-[10px] sm:text-xs tracking-[0.8em] uppercase font-bold mb-4 ml-4">
              The Works of
            </span>
            <h1 className="text-[var(--color-brand-ink)] text-[clamp(3.5rem,15vw,15rem)] font-display italic leading-[0.75] tracking-tighter opacity-90 drop-shadow-[0_20px_50px_rgba(0,0,0,0.05)] select-none">
              Liza Kalinina
            </h1>
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
                Based in Moscow · Available Worldwide
              </p>
            </div>
            {/* Minimalist Animated Scroll Line */}
            <div className="h-24 w-[1px] bg-gradient-to-b from-[var(--color-brand-ink)]/60 to-transparent animate-pulse delay-700" />
          </motion.div>
        </div>
      </section>

      <section 
        className={`relative z-20 transition-colors duration-1000 ${activeCategory === "Premiere" ? "bg-black text-white" : "bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)]"} pt-24 pb-48 px-6 md:px-12 lg:px-24`}
      >
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24 xl:gap-32">
          
          <aside className="md:w-64 shrink-0">
            <div className="sticky top-32 flex flex-col gap-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`text-left text-lg md:text-xl transition-all duration-500 ${
                    activeCategory === cat && !showPremiereModal
                      ? (activeCategory === "Premiere" ? "text-red-600 font-normal italic" : "text-[var(--color-brand-ink)] font-normal italic")
                      : (activeCategory === "Premiere" ? "text-white/30 font-light hover:text-white" : "text-gray-400 font-light hover:text-gray-600")
                  } ${cat === "Premiere" ? "mt-8 border-t border-current/10 pt-8" : ""}`}
                >
                  {cat === "Premiere" ? (
                    <span className="flex items-center gap-2">
                       {cat} <span className={`inline-block w-2 h-2 rounded-full ${showPremiereModal ? 'bg-red-600' : 'bg-red-600/50'} transition-colors animate-pulse`} />
                    </span>
                  ) : (
                    cat
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-16 md:gap-12 lg:gap-32 border-l ${activeCategory === "Premiere" ? "border-white/5" : "border-black/5"} pl-0 md:pl-16 lg:pl-32`}>
            {[...projects, ...unlockedProjects].map((project: any) => {
              const dbCategory = CATEGORY_MAP[activeCategory];
              const isMatch = project.category === activeCategory || project.category === dbCategory;
              const isNarrative = activeCategory === "Narrative";
              const mode = activeCategory === "Premiere" ? "theatrical" : "editorial";
              
              if (!isMatch) return null;

              if (isNarrative) {
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="group border-b border-black/5 py-12 cursor-pointer relative"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 group-hover:text-red-500 transition-colors">
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

                    {/* Hover Visual Teaser */}
                    <div className="absolute top-1/2 right-32 -translate-y-1/2 w-64 aspect-2-1 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none overflow-hidden rotate-3 group-hover:rotate-0 scale-90 group-hover:scale-100 z-10 shadow-2xl translate-x-12 group-hover:translate-x-0 hidden lg:block">
                      <img src={project.media_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.article 
                  key={project.id}
                  initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-8 group"
                >
                <div 
                  className={`relative aspect-2-1 w-full ${mode === 'theatrical' ? 'bg-zinc-900 border border-white/5 shadow-2xl' : 'bg-gray-200'} overflow-hidden cursor-pointer`}
                  onClick={() => setSelectedProject(project)}
                >
                  {project.media_url.match(/\.(mp4|webm|ogg|mov)$|^blob:|^data:video/i) ? (
                    <video 
                      src={project.media_url} 
                      muted 
                      autoPlay 
                      loop 
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  ) : (
                    <img 
                      src={project.media_url} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}
                  <div className={`absolute inset-0 ${mode === 'theatrical' ? 'bg-gradient-to-t from-black/80 via-transparent to-transparent' : 'bg-black/0 group-hover:bg-black/10'} transition-all duration-500 flex flex-col items-center justify-center p-8`}>
                     <span className={`opacity-0 group-hover:opacity-100 text-white border ${mode === 'theatrical' ? 'border-red-600' : 'border-white/50'} rounded-full px-12 py-4 uppercase tracking-[0.4em] text-[10px] transition-all duration-500 transform group-hover:translate-y-0 translate-y-8 backdrop-blur-sm`}>
                       Screening
                     </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-24 max-w-7xl">
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                    <h2 className={`text-4xl md:text-5xl lg:text-7xl ${mode === 'theatrical' ? 'text-white font-display italic tracking-tight' : 'text-[var(--color-brand-ink)]'}`}>
                      {project.title}
                    </h2>
                    <p className={`text-xl italic font-display ${mode === 'theatrical' ? 'text-red-600' : 'text-gray-500'}`}>
                      {project.category} · {project.year}
                    </p>
                    <p className={`text-base leading-relaxed max-w-xl mt-4 ${mode === 'theatrical' ? 'text-white/60' : 'text-gray-700'}`}>
                      {project.description}
                    </p>
                  </div>

                  <div className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-2 text-sm border-l ${mode === 'theatrical' ? 'border-white/10 text-white/40' : 'border-black/10 text-gray-500'} pl-6 lg:pl-8`}>
                    <div className={`grid grid-cols-[1fr_2fr] gap-4 items-baseline border-b ${mode === 'theatrical' ? 'border-white/5' : 'border-black/5'} pb-4`}>
                      <span className="uppercase tracking-widest text-[9px] opacity-50">Role</span>
                      <strong className={`font-normal ${mode === 'theatrical' ? 'text-white' : 'text-[var(--color-brand-ink)]'}`}>{project.role}</strong>
                    </div>
                    <div className={`grid grid-cols-[1fr_2fr] gap-4 items-baseline border-b ${mode === 'theatrical' ? 'border-white/5' : 'border-black/5'} py-4`}>
                      <span className="uppercase tracking-widest text-[9px] opacity-50">Director</span>
                      <strong className={`font-normal ${mode === 'theatrical' ? 'text-white' : 'text-[var(--color-brand-ink)]'}`}>{project.director}</strong>
                    </div>
                    <div className={`grid grid-cols-[1fr_2fr] gap-4 items-baseline border-b ${mode === 'theatrical' ? 'border-white/5' : 'border-black/5'} py-4`}>
                      <span className="uppercase tracking-widest text-[9px] opacity-50">Client</span>
                      <strong className={`font-normal ${mode === 'theatrical' ? 'text-white' : 'text-[var(--color-brand-ink)]'}`}>{project.client}</strong>
                    </div>
                    <div className={`grid grid-cols-[1fr_2fr] gap-4 items-baseline border-b ${mode === 'theatrical' ? 'border-white/5' : 'border-black/5'} py-4`}>
                      <span className="uppercase tracking-widest text-[9px] opacity-50">Studio</span>
                      <strong className={`font-normal ${mode === 'theatrical' ? 'text-white' : 'text-[var(--color-brand-ink)]'}`}>{project.production_company}</strong>
                    </div>
                    {project.awards && (
                      <div className={`mt-6 pt-2 font-normal italic font-display ${mode === 'theatrical' ? 'text-red-600/80' : 'text-[#b09e8d]'}`}>
                        {project.awards}
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
              );
            })}
            
            {activeCategory === "Premiere" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-16 pb-32 border-t border-white/5 flex flex-col items-center gap-8"
              >
                <div className="text-center space-y-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/40">Have another ticket?</p>
                  <h3 className="text-3xl font-display italic text-white/90">Unlock Exclusive Content</h3>
                </div>
                <button 
                  onClick={() => setShowPremiereModal(true)}
                  className="flex items-center gap-4 border border-white/20 hover:border-red-600 hover:bg-red-600 px-12 py-5 rounded-full text-white transition-all group"
                >
                  <span className="text-sm uppercase tracking-widest font-medium">Enter New Pass</span>
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </motion.div>
            )}

            {/* Filter fallback state */}
            {([...projects, ...unlockedProjects]).filter((p: any) => p.category === activeCategory || p.category === CATEGORY_MAP[activeCategory]).length === 0 && (
               <div className={`py-32 text-center italic font-display text-xl ${activeCategory === "Premiere" ? "text-white/40" : "text-gray-400"}`}>
                 No projects loaded for {activeCategory} yet.
                 {activeCategory === "Premiere" && (
                   <button 
                     onClick={() => setShowPremiereModal(true)}
                     className="block mx-auto mt-8 text-red-600 border-b border-red-600/30 text-sm uppercase tracking-widest pb-1 hover:border-red-600 transition-colors"
                   >
                     Enter your pass to unlock works
                   </button>
                 )}
               </div>
            )}
          </div>
          
        </div>
      </section>

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
              <div className="absolute inset-0 -z-10 translate-y-4 scale-110 blur-[100px] bg-red-600/20 opacity-50 transition-opacity duration-1000" />
              
              <div className="relative w-full h-full bg-black overflow-hidden">
                {selectedProject.category === 'PREMIERE' && (
                  <div className="absolute top-8 left-8 z-[210] flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white drop-shadow-md">Premiering Now</span>
                  </div>
                )}

                {selectedProject.media_url.match(/\.(mp4|webm|ogg|mov)$|^blob:|^data:video/i) ? (
                  <video 
                    src={selectedProject.media_url} 
                    autoPlay 
                    loop 
                    controls
                    playsInline
                     className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={selectedProject.media_url} 
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
                      <img src={img} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
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
                <p className="text-xl text-red-600 font-display italic">{selectedProject.category} · {selectedProject.year}</p>
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
                  <p className="text-red-600/60 italic font-display mt-8 text-right max-w-xs">{selectedProject.awards}</p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
       )}
      </AnimatePresence>
    </main>
  );
}
