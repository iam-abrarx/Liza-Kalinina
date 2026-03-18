"use client";

import { useState, useEffect } from "react";
import { Plus, Link as LinkIcon, Lock, Trash2, X, Check, Upload, Pencil } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Form states
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isPassFormOpen, setIsPassFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<string[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
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
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }
      
      if (uploadedUrls.length > 0) {
        if (isGallery) {
          setNewProject(prev => ({ 
            ...prev, 
            gallery: [...prev.gallery, ...uploadedUrls].slice(0, 10) 
          }));
        } else {
          setNewProject(prev => ({ ...prev, media_url: uploadedUrls[0] }));
        }
        showMessage(`${uploadedUrls.length} file(s) uploaded successfully`);
      } else {
        showMessage("Upload failed", "error");
      }
    } catch (error) {
      showMessage("Error uploading file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setNewProject(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleFetchVimeoMeta = async () => {
    const url = newProject.media_url;
    if (!url || !url.includes('vimeo.com')) {
      showMessage("Please enter a valid Vimeo URL first", "error");
      return;
    }

    setIsFetchingMeta(true);
    try {
      // Use Vimeo oEmbed API
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Failed to fetch Vimeo metadata");
      
      const data = await res.json();
      
      // Extract title and year
      // The user wants 'name/title' and 'year'
      // Example title: "Directors showreel Elizabeth Kalinin 2025"
      let year = newProject.year;
      if (data.upload_date) {
        year = data.upload_date.split('-')[0];
      }

      setNewProject(prev => ({
        ...prev,
        title: data.title || prev.title,
        year: year,
        thumbnail_url: data.thumbnail_url || prev.thumbnail_url
      }));
      
      showMessage("Vimeo details fetched successfully");
    } catch (error) {
      console.error(error);
      showMessage("Error fetching Vimeo details", "error");
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const generateThumbnails = async (videoUrl: string) => {
    setIsGeneratingThumbs(true);
    setThumbnailSuggestions([]);
    try {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject("Failed to load video");
      });

      const duration = video.duration;
      // Extract 5 frames across the video
      const fractions = [0.1, 0.3, 0.5, 0.7, 0.9];
      const thumbs: string[] = [];

      for (const frac of fractions) {
        video.currentTime = duration * frac;
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });
        const canvas = document.createElement("canvas");
        const scale = Math.min(1280 / video.videoWidth, 1);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbs.push(canvas.toDataURL("image/jpeg", 0.7)); // smaller payload
      }
      setThumbnailSuggestions(thumbs);
      showMessage("Thumbnails generated successfully");
    } catch (e) {
      console.error(e);
      showMessage("Error generating thumbnails", "error");
    } finally {
      setIsGeneratingThumbs(false);
    }
  };
  const [newPass, setNewPass] = useState({
    pass_code: "",
    linked_project_id: "",
    expires_at: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [projRes, passRes] = await Promise.all([
        fetch('/api/projects?admin=true'),
        fetch('/api/ticket-passes')
      ]);
      
      if (!projRes.ok || !passRes.ok) throw new Error("API unavailable");
      
      setProjects(await projRes.json());
      setPasses(await passRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setProjects([]);
      setPasses([]);
    }
  };

  const showMessage = (text: string, type: string = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        showMessage("Project created successfully");
        setIsProjectFormOpen(false);
        setNewProject({
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
            gallery: [],
            sort_order: 0
        });
        fetchData();
      } else {
        showMessage("Failed to create project", "error");
      }
    } catch (error) {
      showMessage("Error creating project", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = (project: any) => {
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
      sort_order: project.sort_order || 0
    });
    setIsProjectFormOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${editingProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        showMessage("Project updated successfully");
        setIsProjectFormOpen(false);
        setEditingProjectId(null);
        setNewProject({
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
          gallery: [],
          sort_order: 0
        });
        fetchData();
      } else {
        showMessage("Failed to update project", "error");
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`/api/ticket-passes/${id}`, { method: 'DELETE' });
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
    const cleanUrl = url.replace(/^\/Liza-Kalinina/, '');
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#111] text-white font-body px-4">
        <div className="max-w-md w-full text-center">
          <Lock size={48} strokeWidth={1} className="mx-auto mb-8 opacity-50" />
          <h1 className="text-3xl font-display mb-8 italic">Admin Login</h1>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password === 'admin') setIsAuthenticated(true);
            }}
            placeholder="Enter Admin Password"
            className="w-full bg-transparent border-b border-white/20 focus:border-white py-4 text-center text-xl tracking-widest outline-none mb-4"
          />
          <p className="text-xs text-white/50">(Password is 'admin' for demo purposes)</p>
        </div>
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
            <p className="text-sm uppercase tracking-widest text-gray-500 mt-2">Liza Kalinina Portfolio</p>
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
                onClick={() => { setEditingProjectId(null); setIsProjectFormOpen(true); }}
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
                      {getVimeoId(p.media_url) ? (
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
          <div className="w-full max-w-2xl h-full bg-[var(--color-brand-bg)] p-8 md:p-12 overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-display italic">{editingProjectId ? "Edit Project" : "Create New Project"}</h2>
              <button onClick={() => { setIsProjectFormOpen(false); setEditingProjectId(null); }} className="text-gray-400 hover:text-black transition-colors">
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            <form onSubmit={editingProjectId ? handleUpdateProject : handleCreateProject} className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Project Title</label>
                  <input 
                    required
                    value={newProject.title}
                    onChange={e => setNewProject({...newProject, title: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                    placeholder="e.g. Midnight Motion"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Category</label>
                  <select 
                    value={newProject.category}
                    onChange={e => setNewProject({...newProject, category: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium appearance-none"
                  >
                    <option value="COMMERCIAL">Commercials</option>
                    <option value="MUSIC_VIDEO">Music Videos</option>
                    <option value="NARRATIVE">Narrative</option>
                    <option value="DOCUMENTARY">Documentaries</option>
                    <option value="STILLS">Stills</option>
                    <option value="FEATURED">Featured (Private)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Year</label>
                  <input 
                    required
                    value={newProject.year}
                    onChange={e => setNewProject({...newProject, year: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400">Media URL (Vimeo link or direct video)</label>
                    <div className="flex items-center gap-4">
                      {/* Fetch Button */}
                      <button
                        type="button"
                        onClick={handleFetchVimeoMeta}
                        disabled={isFetchingMeta || !newProject.media_url.includes('vimeo.com')}
                        className="text-[10px] uppercase font-bold text-gray-500 hover:text-black disabled:opacity-30 flex items-center gap-1 transition-colors"
                        title="Auto-fill title and year from Vimeo"
                      >
                        {isFetchingMeta ? "FETCHING..." : "FETCH DETAILS"}
                        {!isFetchingMeta && <LinkIcon size={12} />}
                      </button>

                      {/* Generate Thumbnails Button */}
                      {!newProject.media_url.includes('vimeo.com') && newProject.media_url && (
                        <>
                          <div className="h-3 w-[1px] bg-black/10" />
                          <button
                            type="button"
                            onClick={() => generateThumbnails(newProject.media_url)}
                            disabled={isGeneratingThumbs}
                            className="text-[10px] uppercase font-bold text-gray-500 hover:text-black disabled:opacity-30 flex items-center gap-1 transition-colors"
                            title="Generate high-quality thumbnails from this local video"
                          >
                            {isGeneratingThumbs ? "GENERATING..." : "GENERATE THUMBNAILS"}
                          </button>
                        </>
                      )}

                      <div className="h-3 w-[1px] bg-black/10" />

                      {/* Upload Button */}
                      <label className="cursor-pointer hover:text-black text-gray-400 transition-colors flex items-center gap-2">
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        {isUploading ? (
                          <span className="text-[10px] uppercase font-bold text-black animate-pulse">UPLOADING...</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-500 hover:text-black">Upload File</span>
                            <Upload size={14} className="text-gray-400" />
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      required
                      value={newProject.media_url}
                      onChange={e => setNewProject({...newProject, media_url: e.target.value})}
                      className="w-full bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                      placeholder="https://..."
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Supports Vimeo links and direct video/HLS URLs.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Role</label>
                  <input 
                    value={newProject.role}
                    onChange={e => setNewProject({...newProject, role: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Director</label>
                  <input 
                    value={newProject.director}
                    onChange={e => setNewProject({...newProject, director: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Client / Brand</label>
                  <input 
                    value={newProject.client}
                    onChange={e => setNewProject({...newProject, client: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Production House</label>
                  <input 
                    value={newProject.production_company}
                    onChange={e => setNewProject({...newProject, production_company: e.target.value})}
                    className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">Awards & Festivals</label>
                <input 
                  value={newProject.awards}
                  onChange={e => setNewProject({...newProject, awards: e.target.value})}
                  className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                  placeholder="Official Selection — Cannes..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">Short Description</label>
                <textarea 
                  rows={2}
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="bg-transparent border border-black/10 focus:border-black outline-none p-3 font-light text-sm"
                  placeholder="Short project overview for the grid..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">Full Story / Narrative Detail (Optional)</label>
                <textarea 
                  rows={6}
                  value={newProject.long_description}
                  onChange={e => setNewProject({...newProject, long_description: e.target.value})}
                  className="bg-transparent border border-black/10 focus:border-black outline-none p-3 font-light text-sm"
                  placeholder="The full story behind the project. Exclusive details for Narrative mode..."
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Project Thumbnail / Cover Selection</label>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-2">
                  {/* Candidates for Thumbnail */}
                  {[
                    newProject.media_url && !newProject.media_url.includes('vimeo.com') ? newProject.media_url : null,
                    newProject.thumbnail_url && newProject.thumbnail_url.includes('vimeocdn.com') ? newProject.thumbnail_url : null,
                    ...thumbnailSuggestions,
                    ...newProject.gallery
                  ].filter(Boolean).map((url, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setNewProject(prev => ({ ...prev, thumbnail_url: url as string }))}
                      className={`min-w-[150px] aspect-video relative cursor-pointer border-2 transition-all ${
                        newProject.thumbnail_url === url 
                          ? 'border-black scale-[1.02]' 
                          : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={url as string} alt="" className="w-full h-full object-cover" />
                      {newProject.thumbnail_url === url && (
                        <div className="absolute top-2 right-2 bg-black text-white px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold">COVER</div>
                      )}
                    </div>
                  ))}
                  
                  {(!newProject.media_url || newProject.media_url.includes('vimeo.com')) && !newProject.thumbnail_url && newProject.gallery.length === 0 && (
                     <div className="w-full py-6 border border-dashed border-black/5 flex items-center justify-center text-gray-400 italic text-[10px]">
                        Add gallery photos or enter Media URL to pick a cover
                     </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest text-gray-400">Project Gallery (Max 10 images)</label>
                  <label className="cursor-pointer text-black hover:opacity-70 transition-opacity flex items-center gap-2">
                    <input 
                      type="file" 
                      multiple
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, true)}
                      disabled={isUploading}
                    />
                    <Plus size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Add Picture</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {newProject.gallery.map((url, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 relative group border border-black/5">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-1 right-1 bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {newProject.gallery.length === 0 && (
                    <div className="col-span-4 py-8 border-2 border-dashed border-black/5 rounded-sm flex flex-col items-center justify-center text-gray-400">
                      <p className="text-xs italic uppercase tracking-widest opacity-50">No gallery images added</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="bg-black text-white py-4 uppercase tracking-[0.2em] text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 mt-4"
              >
                {isLoading ? "Saving..." : (editingProjectId ? "Update Project" : "Publish Project")}
              </button>
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
