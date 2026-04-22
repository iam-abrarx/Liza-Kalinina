"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getMediaUrl, getVimeoId, isVideo } from "@/lib/utils";
import { Project } from "@/types";

interface TheaterModeProps {
  project: Project | null;
  onClose: () => void;
}

export function TheaterMode({ project, onClose }: TheaterModeProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const isPhotography = project?.category === 'STILLS';

  return (
    <AnimatePresence mode="wait">
      {project && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-start overflow-y-auto bg-black/95 py-12 px-4 md:px-12 lg:px-24 scrollbar-hide"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[80px] -z-10"
            onClick={onClose}
          />

          <button 
            onClick={onClose}
            className="fixed top-8 right-8 md:top-12 md:right-12 text-white/50 hover:text-white transition-colors z-[210] bg-black/20 p-2 rounded-full backdrop-blur-md"
          >
            <X size={32} strokeWidth={1} />
          </button>

          {/* Fullscreen Image Overlay */}
          <AnimatePresence>
            {fullscreenImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[250] bg-black flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setFullscreenImage(null)}
              >
                <img 
                  src={getMediaUrl(fullscreenImage)} 
                  alt="" 
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
                <button 
                  onClick={() => setFullscreenImage(null)}
                  className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                >
                  <X size={32} strokeWidth={1} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-5xl flex flex-col items-center gap-12">
            {!isPhotography || (isPhotography && !project.is_album) ? (
              /* Video or Single Photo Main View */
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`relative w-full shadow-2xl z-[205] group ${isPhotography && project.orientation === 'portrait' ? 'max-w-2xl aspect-[3/4]' : 'aspect-video'}`}
              >
                <div className="absolute inset-0 -z-10 translate-y-4 scale-110 blur-[100px] bg-white/5 opacity-50 transition-opacity duration-1000" />
                
                <div className="relative w-full h-full bg-black overflow-hidden rounded-sm">
                  {project.category === 'FEATURED' && (
                    <div className="absolute top-8 left-8 z-[210] flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                      <span className="text-[10px] uppercase tracking-[0.4em] font-normal text-white drop-shadow-md">Films Now</span>
                    </div>
                  )}

                  {getVimeoId(project.media_url) ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${getVimeoId(project.media_url)}?autoplay=1&title=0&byline=0&portrait=0`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isVideo(project.media_url) ? (
                    <video 
                      src={getMediaUrl(project.media_url)} 
                      autoPlay 
                      loop 
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={getMediaUrl(project.media_url || project.thumbnail_url || '')} 
                      alt={project.title}
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => setFullscreenImage(project.media_url || project.thumbnail_url || '')}
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              /* Album View: Grid of Images */
              <div className="w-full flex flex-col gap-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[project.thumbnail_url, ...project.gallery].filter(Boolean).map((img, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative aspect-video md:aspect-square bg-zinc-900 overflow-hidden rounded-sm cursor-zoom-in group"
                        onClick={() => setFullscreenImage(img!)}
                      >
                        <img src={getMediaUrl(img!)} alt="" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                 </div>
              </div>
            )}

            {/* Non-Photography Gallery (Behind the Frames) */}
            {!isPhotography && project.gallery && project.gallery.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-5xl flex flex-col gap-8 mt-12"
              >
                <div className="flex justify-between items-baseline">
                  <h4 className="text-white/40 text-[10px] uppercase tracking-[0.5em] font-normal">Behind the Frames</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.gallery.map((img: string, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="aspect-video bg-zinc-900 overflow-hidden cursor-zoom-in group"
                      onClick={() => setFullscreenImage(img)}
                    >
                      <img src={getMediaUrl(img)} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
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
                {project.title && (
                  <h3 className="text-xl md:text-2xl text-white font-display italic leading-tight">{project.title}</h3>
                )}
                <p className="text-[10px] text-white/30 font-display tracking-[0.4em] uppercase">{project.category} · {project.year}</p>
                <div className="space-y-4 mt-6">
                  <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-lg font-normal">
                    {project.description}
                  </p>
                  {project.long_description && (
                    <p className="text-[10px] text-white/30 leading-relaxed max-w-lg font-light italic">
                      {project.long_description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end items-end gap-2 text-[10px] text-white/50">
                {project.director && <p className="uppercase tracking-[0.4em] font-normal text-right">Director: {project.director}</p>}
                {project.role && <p className="uppercase tracking-[0.4em] font-normal text-right">DP: {project.role}</p>}
                {project.production_company && <p className="uppercase tracking-[0.4em] font-normal text-white/30 mt-1 text-right">Production: {project.production_company}</p>}
                {project.awards && (
                  <p className="text-white/40 italic font-display mt-4 text-right max-w-xs text-[11px]">{project.awards}</p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
