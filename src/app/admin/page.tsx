"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Link as LinkIcon, Lock, Trash2, X, Check, Upload as UploadIcon, Pencil, ChevronLeft, ChevronRight, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import Link from "next/link";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { useProjectForm } from "@/hooks/useProjectForm";

export default function AdminDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Custom hooks
  const { 
    newProject, setNewProject, editingProjectId, formTab, setFormTab, 
    isProjectFormOpen, openNewProjectForm, openEditProjectForm, closeForm 
  } = useProjectForm();
  
  const { isUploading, uploadProgress, uploadFiles, uploadThumbnail } = useMediaUpload(password);
  
  const { 
    isFetchingMeta, isGeneratingThumbs, thumbnailProgress, thumbnailSuggestions, 
    fetchVimeoMeta, generateThumbnails, removeThumbnailCandidate, addThumbnailCandidate, setThumbnailSuggestions
  } = useThumbnailGenerator();

  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = 300;
      thumbnailScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isPassFormOpen, setIsPassFormOpen] = useState(false);

  const showMessage = (text: string, type: string = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let localUrl = '';
    try {
      if (!isGallery) {
        const file = files[0];
        localUrl = URL.createObjectURL(file);
        // Set media_url immediately so the form can submit even if cloud upload is slow/fails
        setNewProject(prev => ({ ...prev, media_url: localUrl }));
        await generateThumbnails(localUrl, (url) => {
            if (!newProject.thumbnail_url) {
                setNewProject(prev => ({ ...prev, thumbnail_url: url }));
            }
        });
      }

      const uploadedUrls = await uploadFiles(files);
      
      if (uploadedUrls.length > 0) {
        if (isGallery) {
          setNewProject(prev => ({ 
            ...prev, 
            gallery: [...prev.gallery, ...uploadedUrls].slice(0, 10) 
          }));
        } else {
          const url = uploadedUrls[0];
          // Upgrade from local blob URL to the permanent cloud URL
          setNewProject(prev => ({ ...prev, media_url: url }));
          
          if (url.match(/\.(mp4|webm|ogg|mov)/i) && thumbnailSuggestions.length === 0) {
              const res = await generateThumbnails(url);
              if (res && res.unique) {
                showMessage(`${res.unique.length} thumbnails generated`);
              }
          }
        }
        showMessage(`${uploadedUrls.length} file(s) uploaded successfully`);
      } else if (!isGallery) {
        // Cloud upload returned empty but local URL is already set — keep it
        showMessage("Video selected locally. Cloud upload pending.", "success");
      }
    } catch (error: any) {
      if (!isGallery && localUrl) {
        // Keep the local URL even if cloud upload fails
        showMessage("Video loaded locally. Cloud upload failed — you can still save.", "error");
      } else {
        showMessage(error.message || "Error uploading file", "error");
      }
    }
  };

  const handleFetchVimeoMeta = async () => {
    if (!newProject.media_url || !newProject.media_url.includes('vimeo.com')) {
      showMessage("Please enter a valid Vimeo URL first", "error");
      return;
    }
    try {
        const data = await fetchVimeoMeta(newProject.media_url);
        let year = newProject.year;
        if (data.upload_date) {
          year = data.upload_date.split('-')[0];
        }
        setNewProject(prev => ({
          ...prev,
          title: data.title || prev.title,
          year: year,
          thumbnail_url: data.thumbnail_url || prev.thumbnail_url,
          director: data.author_name || prev.director
        }));
        showMessage(`Fetched: "${data.title}" (${year})`);
    } catch (error: any) {
        showMessage(error.message || "Error fetching Vimeo details", "error");
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadThumbnail(file);
      if (url) {
        setNewProject(prev => ({ ...prev, thumbnail_url: url }));
        addThumbnailCandidate(url);
        showMessage("Custom thumbnail uploaded");
      }
    } catch (error: any) {
      showMessage(error.message || "Upload failed", "error");
    }
  };

  const executeGenerateThumbnails = async (url: string) => {
      try {
          const res = await generateThumbnails(url, (selectedUrl) => {
            if (!newProject.thumbnail_url) {
               setNewProject(prev => ({ ...prev, thumbnail_url: selectedUrl }));
            }
          });
          if (res) {
            showMessage(`${res.unique ? res.unique.length : 0} thumbnails generated`);
          }
      } catch (error: any) {
          showMessage(error.message || "Error generating thumbnails", "error");
      }
  };

  const removeGalleryImage = (index: number) => {
    setNewProject(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const proxyRemoveThumbnailCandidate = (url: string) => {
    removeThumbnailCandidate(url);
    if (newProject.thumbnail_url === url) {
      setNewProject(prev => ({ ...prev, thumbnail_url: "" }));
    }
  };
  const [newPass, setNewPass] = useState({
    pass_code: "",
    linked_project_id: "",
    expires_at: ""
  });



  useEffect(() => {
    // Only auto-fetch if we already have a password in memory (e.g. from local storage or previous session)
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      // Use the dedicated auth endpoint with POST for strict verification
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'x-admin-password': password }
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        showMessage("Logged in successfully");
      } else {
        const data = await res.json();
        showMessage(data.error || "Invalid Password", "error");
      }
    } catch (error) {
      showMessage("Connection failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [projectsRes, passesRes] = await Promise.all([
        fetch('/api/projects', {
          headers: { 'x-admin-password': password }
        }),
        fetch('/api/ticket-passes', {
          headers: { 'x-admin-password': password }
        })
    ]);
      
      if (!projectsRes.ok || !passesRes.ok) throw new Error("API unavailable");
      
      setProjects(await projectsRes.json());
      setPasses(await passesRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setProjects([]);
      setPasses([]);
    }
  };


  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      // Check for base64 thumbnails which bloat the DB
      if (newProject.thumbnail_url?.startsWith('data:')) {
        if (!confirm("This project is using a temporary video frame as a cover. This can slow down the site. We recommend uploading a proper JPG cover later. Proceed anyway?")) {
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': password 
        },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        showMessage("Project created successfully");
        closeForm();
        fetchData();
      } else {
        const err = await res.json();
        showMessage(err.error || "Failed to create project", "error");
      }
    } catch (error) {
      showMessage("Error creating project", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = (project: any) => {
    openEditProjectForm(project);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;

    setIsLoading(true);
    try {
      // Check for base64 thumbnails
      if (newProject.thumbnail_url?.startsWith('data:')) {
        if (!confirm("This project is using a temporary video frame as a cover. We recommend uploading a JPG for better performance. Update anyway?")) {
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/projects/${editingProjectId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': password 
        },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        showMessage("Project updated successfully");
        closeForm();
        fetchData();
      } else {
        const err = await res.json();
        showMessage(err.error || "Failed to update project", "error");
      }
    } catch (error) {
      showMessage("Error updating project", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/ticket-passes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': password 
        },
        body: JSON.stringify(newPass)
      });
      if (res.ok) {
        showMessage("Ticket Pass generated");
        setIsPassFormOpen(false);
        setNewPass({ pass_code: "", linked_project_id: "", expires_at: "" });
        fetchData();
      } else {
        const err = await res.json();
        showMessage(err.error || "Failed to create pass", "error");
      }
    } catch (error) {
      showMessage("Error creating pass", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { 
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Project deleted");
        fetchData();
      } else {
        showMessage(data.error || "Failed to delete project", "error");
      }
    } catch (error) {
      showMessage("Error connecting to server", "error");
    }
  };

  const handleDeletePass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket pass?")) return;
    try {
      const res = await fetch(`/api/ticket-passes/${id}`, { 
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Pass deleted");
        fetchData();
      } else {
        showMessage(data.error || "Failed to delete pass", "error");
      }
    } catch (error) {
      showMessage("Error connecting to server", "error");
    }
  };

  const getVimeoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    // Ensure local paths start with /
    return url.startsWith('/') ? url : `/${url}`;
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#111] text-white font-body px-4">
        <form onSubmit={handleLogin} className="max-w-md w-full text-center">
          <Lock size={48} strokeWidth={1} className="mx-auto mb-8 opacity-50" />
          <h1 className="text-3xl font-display mb-8 italic">Admin Login</h1>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Admin Password"
            className="w-full bg-transparent border-b border-white/20 focus:border-white py-4 text-center text-xl tracking-widest outline-none mb-8"
            autoFocus
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full border border-white/20 py-4 hover:bg-white hover:text-black transition-all uppercase tracking-widest font-bold text-xs"
          >
            {isLoading ? "Verifying..." : "Enter Dashboard"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)] p-6 md:p-12 font-body text-[var(--color-brand-ink)] relative">
      
      {/* Toast Message */}
      {message.text && (
        <div className={`fixed top-8 right-8 z-[200] px-6 py-3 rounded-md shadow-xl flex items-center gap-3 transition-all ${
          message.type === 'error' ? 'bg-black text-white' : 'bg-black text-white'
        }`}>
          {message.type === 'error' ? <X size={18} /> : <Check size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <header className="flex justify-between items-center mb-16 pb-6 border-b border-black/10">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-display italic">Dashboard</h1>
            <p className="text-sm uppercase tracking-widest text-gray-500 mt-2">Elizabeth Kalinina Portfolio</p>
          </div>
          <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter uppercase flex items-center gap-2 bg-green-100 text-green-700">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500" />
            Live Database
          </div>
        </div>
        <Link href="/" className="text-sm font-medium border border-black/20 px-6 py-2 rounded-full hover:bg-black hover:text-white transition-colors">
          View Live Site
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        {/* Projects Column */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-display">Manage Projects</h2>
              <button 
                onClick={openNewProjectForm}
                className="flex items-center gap-2 text-sm uppercase tracking-wider bg-black text-white px-4 py-2 rounded-sm hover:-translate-y-1 transition-transform"
              >
                <Plus size={16} /> New Project
              </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {projects.length === 0 ? (
              <p className="text-gray-500 italic">No projects added yet.</p>
            ) : (
              projects.map(p => (
                <div key={p.id} className="p-4 border border-black/10 bg-white flex justify-between items-center group hover:border-black/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-20 aspect-video bg-zinc-900 overflow-hidden border border-black/5 flex items-center justify-center">
                      {p.thumbnail_url ? (
                        <img src={getMediaUrl(p.thumbnail_url)} alt="" className="w-full h-full object-cover" />
                      ) : getVimeoId(p.media_url) ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-bold text-white/40">VIMEO</span>
                        </div>
                      ) : getMediaUrl(p.media_url).match(/\.(mp4|webm|ogg|mov)$|^blob:|^data:video/i) ? (
                        <video src={getMediaUrl(p.media_url)} muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={getMediaUrl(p.media_url)} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{p.title}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">{p.category} · {p.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider ${p.category === 'FEATURED' ? 'bg-black text-white' : 'bg-green-100 text-green-700'}`}>
                      {p.category === 'FEATURED' ? 'Private' : 'Public'}
                    </span>
                    <button 
                      onClick={() => handleEditProject(p)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Project"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-gray-400 hover:text-black transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Ticket Passes Column */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-display">Featured Access Passes</h2>
            <button 
              onClick={() => setIsPassFormOpen(true)}
              className="flex items-center gap-2 text-sm uppercase tracking-wider border border-black px-4 py-2 hover:bg-black/5 transition-colors"
            >
              <LinkIcon size={16} /> Generate Pass
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {passes.length === 0 ? (
              <p className="text-gray-500 italic">No active ticket passes.</p>
            ) : (
              passes.map(tp => (
                <div key={tp.id} className="p-4 border border-black/10 bg-white relative overflow-hidden flex justify-between items-center">
                  <div className="absolute top-0 left-0 w-1 h-full bg-black/80" />
                  <div className="pl-4">
                    <h3 className="font-mono text-xl tracking-widest text-[#111]">{tp.pass_code}</h3>
                    <p className="text-sm text-gray-600 mt-2">Unlocks: <span className="font-medium">{tp.project?.title || 'Unknown Project'}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Expires: {tp.expires_at ? new Date(tp.expires_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <button 
                    onClick={() => handleDeletePass(tp.id)}
                    className="text-gray-400 hover:text-black transition-colors pr-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Project Creation Overlay */}
      {isProjectFormOpen && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-3xl h-full bg-[var(--color-brand-bg)] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-8 md:px-12 md:py-8 border-b border-black/5 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-display italic transition-all duration-300">
                  {editingProjectId ? "Edit Project" : "Create Project"}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`h-1 w-6 rounded-full transition-all duration-500 ${
                        (s === 1 && formTab === 'basic') || 
                        (s === 2 && formTab === 'media') || 
                        (s === 3 && formTab === 'narrative') || 
                        (s === 4 && formTab === 'gallery')
                          ? 'bg-black w-10' : 'bg-black/10'
                      }`} />
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">
                    {formTab === 'basic' ? 'Step 01 / Details' : 
                     formTab === 'media' ? 'Step 02 / Media' : 
                     formTab === 'narrative' ? 'Step 03 / Narrative' : 
                     'Step 04 / Gallery'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={closeForm} 
                className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-black hover:bg-black/5 rounded-full transition-all"
                title="Close Form"
              >
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-black/5 px-8 md:px-12 bg-white/30 overflow-x-auto no-scrollbar">
              {[
                { id: 'basic', label: 'Details' },
                { id: 'media', label: 'Video & Cover' },
                { id: 'narrative', label: 'Story & Awards' },
                { id: 'gallery', label: 'Behind Scenes' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormTab(tab.id as any)}
                  className={`py-4 px-6 text-[10px] uppercase tracking-widest font-bold transition-all border-b-2 whitespace-nowrap ${
                    formTab === tab.id 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={editingProjectId ? handleUpdateProject : handleCreateProject} className="flex-1 overflow-y-auto p-8 md:p-12 flex flex-col gap-12 bg-gray-50/30">
              
              {/* Tab 1: Basic & Professional Details */}
              {formTab === 'basic' && (
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center justify-between">
                        Project Title {newProject.category !== 'STILLS' && <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        required={newProject.category !== 'STILLS'}
                        value={newProject.title}
                        onChange={e => setNewProject(prev => ({...prev, title: e.target.value}))}
                        className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-3 font-medium text-lg transition-colors"
                        placeholder={newProject.category === 'STILLS' ? "Untitled Still" : "Midnight Motion"}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Category</label>
                      <div className="relative">
                        <select 
                          value={newProject.category}
                          onChange={e => setNewProject(prev => ({...prev, category: e.target.value}))}
                          className="w-full bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-3.5 font-medium appearance-none transition-colors cursor-pointer"
                        >
                          <option value="COMMERCIAL">Commercials</option>
                          <option value="MUSIC_VIDEO">Music Videos</option>
                          <option value="NARRATIVE">Narrative</option>
                          <option value="DOCUMENTARY">Documentaries</option>
                          <option value="FASHION">Fashion</option>
                          <option value="STILLS">Stills/photography</option>
                          <option value="FEATURED">Films (Privately Shared)</option>
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                           <Check size={14} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center justify-between">
                        Release Year <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required
                        value={newProject.year}
                        onChange={e => setNewProject(prev => ({...prev, year: e.target.value}))}
                        className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-3 font-medium transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Catalogue Priority (0 = Auto)</label>
                      <input 
                        type="number"
                        value={newProject.sort_order}
                        onChange={e => setNewProject(prev => ({...prev, sort_order: parseInt(e.target.value) || 0}))}
                        className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-3 font-medium transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-12 border-t border-black/5">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-black/10 mb-10">Professional Credits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Your Role</label>
                        <input 
                          value={newProject.role}
                          onChange={e => setNewProject(prev => ({...prev, role: e.target.value}))}
                          className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-2 font-medium transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Director</label>
                        <input 
                          value={newProject.director}
                          onChange={e => setNewProject(prev => ({...prev, director: e.target.value}))}
                          className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-2 font-medium transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Client / Brand</label>
                        <input 
                          value={newProject.client}
                          onChange={e => setNewProject(prev => ({...prev, client: e.target.value}))}
                          className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-2 font-medium transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Production House</label>
                        <input 
                          value={newProject.production_company}
                          onChange={e => setNewProject(prev => ({...prev, production_company: e.target.value}))}
                          className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-2 font-medium transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Media & Cover Selection */}
              {formTab === 'media' && (
                <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  
                  {/* 1. Primary Cover Preview Area */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">Active Project Cover</label>
                    <div className="relative group/cover aspect-2-1 w-full bg-zinc-900 rounded-2xl overflow-hidden border border-black/5 shadow-2xl transition-all hover:shadow-black/20">
                      {newProject.thumbnail_url ? (
                        <>
                          <img 
                            src={getMediaUrl(newProject.thumbnail_url)} 
                            alt="Selected Cover" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex justify-between items-end">
                            <div>
                              <p className="text-[8px] uppercase tracking-widest text-white/60 mb-1">Source URL</p>
                              <p className="text-[10px] text-white font-mono opacity-80 max-w-md truncate">{newProject.thumbnail_url}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setNewProject(p => ({ ...p, thumbnail_url: "" }))}
                              className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-full transition-all backdrop-blur-md"
                              title="Clear Cover Image"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
                          <ImageIcon size={48} strokeWidth={1} />
                          <p className="text-[10px] uppercase tracking-[0.3em] font-bold">
                            {newProject.category === 'STILLS' ? 'Add Primary Still' : 'No Cover Assigned'}
                          </p>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4 z-20">
                          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span className="text-[10px] uppercase tracking-widest font-black">
                            Processing Upload... {uploadProgress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Unified Action Toolbar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Video URL Input */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      <label className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">Video Resource (Vimeo or MP4)</label>
                      <div className="relative group">
                        <input 
                          value={newProject.media_url}
                          onChange={e => setNewProject(prev => ({...prev, media_url: e.target.value}))}
                          className="w-full bg-white border-2 border-black/5 focus:border-black transition-all outline-none p-4 rounded-xl font-medium text-sm shadow-sm"
                          placeholder={newProject.category === 'STILLS' ? "Optional: Video resource link" : "vimeo.com/123456789 (or upload a video →)"}
                        />
                        {newProject.media_url && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             {newProject.media_url.includes('vimeo.com') && (
                               <button
                                 type="button"
                                 onClick={handleFetchVimeoMeta}
                                 disabled={isFetchingMeta}
                                 className="p-2 bg-black text-white rounded-lg hover:scale-105 active:scale-95 transition-all text-[9px] font-bold uppercase"
                                 title="Auto-fill from Vimeo"
                               >
                                 {isFetchingMeta ? "..." : "Auto"}
                               </button>
                             )}
                             <button 
                               type="button"
                               onClick={() => setNewProject(p => ({ ...p, media_url: "" }))}
                               className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                             >
                               <X size={16} />
                             </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Hub */}
                    <div className="flex flex-col gap-4 h-full">
                      <label className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">Library Actions</label>
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <label className="flex flex-col items-center justify-center bg-black text-white rounded-xl cursor-pointer hover:bg-gray-800 transition-all active:scale-95 border border-black shadow-lg shadow-black/10 group aspect-square lg:aspect-auto">
                           <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploading} />
                           <UploadIcon size={20} className="mb-1 group-hover:-translate-y-0.5 transition-transform" />
                           <span className="text-[9px] uppercase font-black tracking-widest">Cover</span>
                        </label>
                        <label className="flex flex-col items-center justify-center bg-black text-white rounded-xl cursor-pointer hover:bg-gray-800 transition-all active:scale-95 border border-black shadow-lg shadow-black/10 group aspect-square lg:aspect-auto">
                           <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, false)} disabled={isUploading} />
                           <VideoIcon size={20} className="mb-1 group-hover:-translate-y-1 transition-transform" />
                           <span className="text-[9px] uppercase font-black tracking-widest">Video</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => executeGenerateThumbnails(newProject.media_url)}
                          disabled={isGeneratingThumbs || !newProject.media_url}
                          className="col-span-2 flex flex-col items-center justify-center bg-white border-2 border-black/5 rounded-xl hover:border-black transition-all active:scale-95 group disabled:opacity-30 disabled:grayscale py-4"
                        >
                          <VideoIcon size={18} className="mb-1 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-black" />
                          <span className="text-[8px] uppercase font-black tracking-widest text-gray-400 group-hover:text-black">Scan Current Media</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Suggestions Grid */}
                  <div className="flex flex-col gap-6 pt-12 border-t border-black/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-black/20">Discovery: Thumbnail Options</h4>
                      {thumbnailSuggestions.length > 0 && (
                        <button 
                          type="button"
                          onClick={() => setThumbnailSuggestions([])}
                          className="text-[9px] font-black text-red-400 hover:text-red-600 transition-colors uppercase"
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    {thumbnailSuggestions.length === 0 ? (
                      <div className="py-20 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-black/5 rounded-2xl bg-black/[0.01]">
                        <ImageIcon size={32} strokeWidth={1} className="mb-4 opacity-40 text-black" />
                        <p className="text-[10px] uppercase tracking-widest font-medium max-w-[200px] text-center leading-relaxed">
                          Enter a Video URL then click "Scan Video" or upload a custom image to see options here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {thumbnailSuggestions.map((url, idx) => (
                          <div 
                            key={`suggest-${idx}`} 
                            onClick={() => {
                              setNewProject(prev => ({ ...prev, thumbnail_url: url }));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`group aspect-video relative cursor-pointer border-4 transition-all rounded-xl overflow-hidden shadow-sm hover:shadow-xl ${
                              newProject.thumbnail_url === url 
                                ? 'border-black scale-[1.05] z-10' 
                                : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]'
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            
                            {/* Source Type Indicator */}
                            <div className="absolute top-3 left-3 flex gap-1">
                               <div className="bg-black/80 px-2 py-1 rounded text-[7px] uppercase font-black text-white backdrop-blur-sm">
                                 {url.startsWith('https://i.vimeocdn.com') ? 'VIMEO' : url.startsWith('data:') ? 'FRAME' : 'UPLOAD'}
                               </div>
                            </div>

                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                proxyRemoveThumbnailCandidate(url);
                              }}
                              className="absolute top-3 right-3 bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-black"
                            >
                              <X size={10} />
                            </button>

                            {newProject.thumbnail_url === url && (
                              <div className="absolute inset-x-0 bottom-0 bg-black text-white py-2 text-[8px] uppercase tracking-[0.4em] font-black text-center animate-in slide-in-from-bottom-2 duration-300">Selected</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Narrative & Awards */}
              {formTab === 'narrative' && (
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Awards & Accolades</label>
                    <input 
                      value={newProject.awards}
                      onChange={e => setNewProject(prev => ({...prev, awards: e.target.value}))}
                      className="bg-transparent border-b-2 border-black/5 focus:border-black outline-none py-4 font-medium text-lg italic transition-colors"
                      placeholder="e.g. Winner — Best Cinematography, Cannes 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-10">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Quick Summary (Homepage)</label>
                      <textarea 
                        rows={3}
                        value={newProject.description}
                        onChange={e => setNewProject(prev => ({...prev, description: e.target.value}))}
                        className="bg-white border-2 border-transparent focus:border-black outline-none p-5 rounded-xl font-light text-sm shadow-sm leading-relaxed transition-all resize-none"
                        placeholder="A short punchy intro for the project grid..."
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Full Narrative Story & Tech Specs</label>
                      <textarea 
                        rows={10}
                        value={newProject.long_description}
                        onChange={e => setNewProject(prev => ({...prev, long_description: e.target.value}))}
                        className="bg-white border-2 border-transparent focus:border-black outline-none p-6 rounded-xl font-light text-sm shadow-sm leading-relaxed transition-all resize-none"
                        placeholder="Detailed background, story, equipment, and creative vision. This appears in the expanded view for Narrative category..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Behind the Frames (Gallery) */}
              {formTab === 'gallery' && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex justify-between items-center p-8 bg-black text-white rounded-2xl shadow-xl">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.4em] opacity-40 mb-2 font-black">
                        {newProject.category === 'STILLS' ? 'Photography Gallery' : 'Gallery Manager'}
                      </h4>
                      <p className="text-2xl italic font-display">
                        {newProject.category === 'STILLS' ? 'Upload Stills Here' : `${newProject.gallery.length} / 10 Images`}
                      </p>
                    </div>
                    <label className="cursor-pointer bg-white text-black px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-black hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-3">
                      <input 
                        type="file" 
                        multiple
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, true)}
                        disabled={isUploading}
                      />
                      {isUploading ? `UPLOADING ${uploadProgress}%` : "ADD CAPTURES"}
                      {!isUploading && <Plus size={16} />}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {newProject.gallery.map((url, idx) => (
                      <div key={idx} className="aspect-square bg-white p-2 relative group rounded-2xl border border-black/5 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-full h-full rounded-xl overflow-hidden relative">
                          <img src={url} alt="" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="bg-white text-black p-3 rounded-full hover:bg-red-500 hover:text-white transition-all scale-75 group-hover:scale-100"
                              title="Remove Image"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {newProject.gallery.length < 10 && (
                      <label className="aspect-square flex flex-col items-center justify-center border-4 border-dashed border-black/5 rounded-2xl hover:border-black/20 hover:bg-white cursor-pointer transition-all group">
                         <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, true)}
                          disabled={isUploading}
                        />
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-black/5 group-hover:scale-110 transition-transform">
                          <Plus size={32} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-black/20 group-hover:text-black/40">Add More</p>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Sticky Footer in Form */}
              <div className="mt-auto pt-10 flex items-center justify-between sticky bottom-0 bg-transparent py-4">
                <div className="flex gap-4">
                  {formTab !== 'basic' && (
                    <button 
                      type="button"
                      onClick={() => setFormTab(formTab === 'media' ? 'basic' : formTab === 'narrative' ? 'media' : 'narrative')}
                      className="px-10 py-3.5 border-2 border-black/10 rounded-full text-[10px] uppercase tracking-widest font-black hover:bg-white hover:border-black transition-all bg-white/50 backdrop-blur-sm"
                    >
                      Back
                    </button>
                  )}
                  {formTab !== 'gallery' && (
                    <button 
                      type="button"
                      onClick={() => setFormTab(formTab === 'basic' ? 'media' : formTab === 'media' ? 'narrative' : 'gallery')}
                      className="px-10 py-3.5 bg-black text-white rounded-full text-[10px] uppercase tracking-widest font-black hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      Proceed
                    </button>
                  )}
                </div>
                
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`px-12 py-3.5 rounded-full uppercase tracking-[0.3em] text-[10px] font-black transition-all shadow-xl hover:-translate-y-1 active:scale-95 ${
                    isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isLoading ? "SYNCING..." : (editingProjectId ? "UPDATE ARCHIVE" : "PUBLISH PROJECT")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Pass Generation Overlay */}
      {isPassFormOpen && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--color-brand-bg)] p-8 shadow-2xl relative">
            <button onClick={() => setIsPassFormOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
              <X size={24} strokeWidth={1} />
            </button>
            
            <h2 className="text-2xl font-display italic mb-8">Generate Access Pass</h2>

            <form onSubmit={handleCreatePass} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">Secret Code</label>
                <input 
                  required
                  value={newPass.pass_code}
                  onChange={e => setNewPass({...newPass, pass_code: e.target.value})}
                  className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-mono text-xl tracking-widest"
                  placeholder="LIZA-SECRET-01"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">Link to Private Project</label>
                <select 
                  required
                  value={newPass.linked_project_id}
                  onChange={e => setNewPass({...newPass, linked_project_id: e.target.value})}
                  className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium appearance-none"
                >
                  <option value="">Select a Featured project...</option>
                  {projects.filter(p => p.category === 'FEATURED').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">Expiration Date (Optional)</label>
                <input 
                  type="date"
                  value={newPass.expires_at}
                  onChange={e => setNewPass({...newPass, expires_at: e.target.value})}
                  className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="bg-black text-white py-4 uppercase tracking-[0.2em] text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 mt-4"
              >
                {isLoading ? "Generating..." : "Generate & Save"}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
