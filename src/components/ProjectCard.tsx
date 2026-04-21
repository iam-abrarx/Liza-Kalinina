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

export function ProjectCard({ project, mode, onSelect }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  const handleProjectClick = () => {
    onSelect(project);
  };

  return (
    <motion.article className="relative flex flex-col">
      {(project.media_url || project.thumbnail_url) && (
        <div 
          className={`relative aspect-2-1 w-full ${mode === 'theatrical' ? 'bg-zinc-900 border border-black/10 shadow-xl' : 'bg-white'} overflow-hidden cursor-pointer group`}
          onClick={handleProjectClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
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
        </div>
      )}

      {(project.media_url || project.thumbnail_url) && (
        <div className="w-full bg-transparent pt-2 pb-4 px-2 flex flex-col items-start gap-0.5 z-10 font-display">
          {project.title && (
            <h3 className="text-black text-xs md:text-xs tracking-[0.15em] uppercase font-normal text-left">
              {project.title}
            </h3>
          )}
          {project.client && (
            <span className="text-black/50 text-[11px] md:text-xs tracking-[0.15em] uppercase font-normal text-left">
              {project.client}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}
