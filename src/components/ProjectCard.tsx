"use client";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { getMediaUrl, getVimeoId } from "@/lib/utils";
import { Project, ViewMode } from "@/types";

interface ProjectCardProps {
  project: Project;
  mode: ViewMode;
  onSelect: (p: Project) => void;
  onUnlock?: (p: Project) => void;
}

export function ProjectCard({ project, mode, onSelect, onUnlock }: ProjectCardProps) {
  const [unlockCode, setUnlockCode] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

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
          
          // Save to local storage safely
          if (typeof window !== 'undefined') {
            const current = JSON.parse(localStorage.getItem('unlocked_tickets') || '[]');
            if (!current.includes(unlockCode)) {
              localStorage.setItem('unlocked_tickets', JSON.stringify([...current, unlockCode]));
            }
          }
          
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

  const handleProjectClick = () => {
    onSelect(project);
  };

  return (
    <motion.article className="relative flex flex-col">
      {(project.media_url || project.thumbnail_url) && (
        <div 
          className={`relative aspect-2-1 w-full ${mode === 'theatrical' ? 'bg-zinc-900 border border-black/10 shadow-xl' : 'bg-white'} overflow-hidden ${project.is_locked ? '' : 'cursor-pointer group'}`}
          onClick={project.is_locked ? undefined : handleProjectClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
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
          ) : (
            <div className="relative w-full h-full">
              {project.thumbnail_url || getVimeoId(project.media_url) ? (
                <img 
                  src={getMediaUrl(project.thumbnail_url) || `https://vumbnail.com/${getVimeoId(project.media_url)}.jpg`} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={`${getMediaUrl(project.media_url)}#t=0.001`}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  playsInline
                  muted
                />
              )}
              {/* Video Preview Overlay */}
              {!getVimeoId(project.media_url) && project.media_url?.match(/\.(mp4|webm|ogg|mov)/i) && (
                <video 
                  ref={videoRef}
                  src={getMediaUrl(project.media_url)} 
                  muted 
                  loop 
                  playsInline
                  preload="metadata"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {!project.is_locked && (project.media_url || project.thumbnail_url) && (
        <div className="w-full bg-transparent pt-2 pb-4 px-2 flex flex-col items-start gap-0.5 z-10 font-display">
          {project.title && (
            <h3 className="text-black text-[11px] md:text-xs tracking-[0.15em] uppercase font-medium text-left">
              {project.title}
            </h3>
          )}
          {project.client && (
            <span className="text-black/70 text-[9px] md:text-[10px] tracking-[0.1em] uppercase font-normal text-left">
              {project.client}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}
