import { useState } from 'react';

const emptyProject = {
  title: "",
  category: "COMMERCIAL",
  year: new Date().getFullYear().toString(),
  media_url: "",
  thumbnail_url: "",
  role: "Director of Photography",
  director: "",
  client: "",
  production_company: "",
  awards: "",
  description: "",
  long_description: "",
  gallery: [] as string[],
  sort_order: 0
};

export function useProjectForm() {
  const [newProject, setNewProject] = useState({ ...emptyProject });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<'basic' | 'media' | 'narrative' | 'gallery'>('basic');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  const resetProject = () => {
    setNewProject({ ...emptyProject, year: new Date().getFullYear().toString() });
  };

  const openNewProjectForm = () => {
    resetProject();
    setEditingProjectId(null);
    setFormTab('basic');
    setIsProjectFormOpen(true);
  };

  const openEditProjectForm = (project: any) => {
    setEditingProjectId(project.id);
    setNewProject({
      title: project.title || "",
      category: project.category || "COMMERCIAL",
      year: project.year || new Date().getFullYear().toString(),
      media_url: project.media_url || "",
      thumbnail_url: project.thumbnail_url || "",
      role: project.role || "Director of Photography",
      director: project.director || "",
      client: project.client || "",
      production_company: project.production_company || "",
      awards: project.awards || "",
      description: project.description || "",
      long_description: project.long_description || "",
      gallery: project.gallery || [],
      sort_order: parseInt(project.sort_order) || 0
    });
    setFormTab('basic');
    setIsProjectFormOpen(true);
  };

  const closeForm = () => {
    setIsProjectFormOpen(false);
    setEditingProjectId(null);
  };

  return {
    newProject,
    setNewProject,
    editingProjectId,
    formTab,
    setFormTab,
    isProjectFormOpen,
    openNewProjectForm,
    openEditProjectForm,
    closeForm,
    resetProject
  };
}
