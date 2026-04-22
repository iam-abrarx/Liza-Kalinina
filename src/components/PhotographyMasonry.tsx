"use client";

import { motion } from "framer-motion";
import { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";

interface PhotographyMasonryProps {
  projects: Project[];
  onSelect: (p: Project) => void;
}

export function PhotographyMasonry({ projects, onSelect }: PhotographyMasonryProps) {
  // We can group projects into columns for a simple masonry effect
  // or use CSS columns which is easier for true masonry.
  
  return (
    <div className="w-full px-4 md:px-0">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
            className="break-inside-avoid mb-6"
          >
            <div 
              className={`relative overflow-hidden cursor-pointer group transition-all duration-700 hover:shadow-2xl ${
                project.orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/10]'
              }`}
              onClick={() => onSelect(project)}
            >
              <img 
                src={project.thumbnail_url || project.media_url || ''} 
                alt={project.title}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
              />
              
              {/* Overlay for Albums */}
              {project.is_album && (
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[9px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold flex items-center gap-2 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  Album
                </div>
              )}

              {/* Hover Info - Minimalistic */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-white text-[11px] uppercase tracking-[0.3em] font-display mb-1 drop-shadow-md">{project.title}</h3>
                  {project.client && (
                    <p className="text-white/70 text-[9px] uppercase tracking-[0.2em] drop-shadow-md">{project.client}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
