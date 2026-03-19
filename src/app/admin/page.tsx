"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Link as LinkIcon, Lock, Trash2, X, Check, Upload as UploadIcon, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";

export default function AdminDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Form states
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isPassFormOpen, setIsPassFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<string[]>([]);
  const [formTab, setFormTab] = useState<'basic' | 'media' | 'narrative' | 'gallery'>('basic');
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
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      const file = files[0];
      const localUrl = URL.createObjectURL(file);
      generateThumbnails(localUrl);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniqueName = `${Date.now()}-${file.name}`;
        const newBlob = await upload(uniqueName, file, {
          access: 'public',
          handleUploadUrl: `/api/upload?password=${encodeURIComponent(password)}`,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round(((i * 100) + progress.percentage) / files.length));
          }
        });
        if (newBlob.url) uploadedUrls.push(newBlob.url);
      }
      
      if (uploadedUrls.length > 0) {
        if (isGallery) {
          setNewProject(prev => ({ 
            ...prev, 
            gallery: [...prev.gallery, ...uploadedUrls].slice(0, 10) 
          }));
        } else {
          const url = uploadedUrls[0];
          setNewProject(prev => ({ ...prev, media_url: url }));
          // Automatically trigger thumbnail generation for direct videos
          if (url.match(/\.(mp4|webm|ogg|mov)/i)) {
            generateThumbnails(url);
          }
        }
        showMessage(`${uploadedUrls.length} file(s) uploaded successfully`);
      } else {
        showMessage("Upload failed", "error");
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showMessage(error.message || "Error uploading file", "error");
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
      // Try multiple URL formats to maximize success rate
      const urlsToTry: string[] = [url];

      // For unlisted videos like vimeo.com/12345/abcdef, also try the clean ID-only URL
      const unlistedMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
      if (unlistedMatch) {
        // The full URL with hash should work for unlisted videos
        urlsToTry.push(`https://vimeo.com/${unlistedMatch[1]}/${unlistedMatch[2]}`);
        urlsToTry.push(`https://vimeo.com/${unlistedMatch[1]}`);
      }

      // Deduplicate
      const uniqueUrls = [...new Set(urlsToTry)];
      let data: any = null;

      for (const tryUrl of uniqueUrls) {
        try {
          const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(tryUrl)}`);
          if (res.ok) {
            data = await res.json();
            break; // Success!
          }
        } catch { /* try next URL */ }
      }

      if (!data) {
        throw new Error("Could not fetch details. This video may be password-protected or private. Please enter details manually.");
      }

      // Extract title and year
      let year = newProject.year;
      if (data.upload_date) {
        year = data.upload_date.split('-')[0];
      }

      // Also try to extract author/director info
      setNewProject(prev => ({
        ...prev,
        title: data.title || prev.title,
        year: year,
        thumbnail_url: data.thumbnail_url || prev.thumbnail_url,
        director: data.author_name || prev.director
      }));
      
      showMessage(`Fetched: "${data.title}" (${year})`);
    } catch (error: any) {
      console.error(error);
      showMessage(error.message || "Error fetching Vimeo details", "error");
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const generateThumbnails = async (videoUrl: string) => {
    setIsGeneratingThumbs(true);
    setThumbnailProgress(0);
    setThumbnailSuggestions([]);
    try {
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      
      if (vimeoMatch) {
        // === Vimeo: fetch high-res covers from vumbnail API ===
        const vimeoId = vimeoMatch[1];
        const thumbs: string[] = [];
        
        setThumbnailProgress(20);
        // Vumbnail supports different sizes: _large, _medium, default
        const sizes = ['', '_large'];
        for (const size of sizes) {
          thumbs.push(`https://vumbnail.com/${vimeoId}${size}.jpg`);
        }
        setThumbnailProgress(50);

        // Also try Vimeo oEmbed for the official thumbnail
        try {
          const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url) {
              // Get max resolution by removing size suffix
              const hiRes = data.thumbnail_url.replace(/_\d+x\d+/, '');
              const midRes = data.thumbnail_url.replace(/_\d+x\d+/, '_1280x720');
              thumbs.unshift(hiRes, midRes);
            }
          }
        } catch { /* ignore fetch errors */ }

        setThumbnailProgress(90);
        // Deduplicate
        const unique = [...new Set(thumbs)];
        setThumbnailSuggestions(unique);
        setThumbnailProgress(100);
        showMessage(`${unique.length} Vimeo thumbnails found`);
      } else {
        // === Direct video: extract frames via canvas ===
        const video = document.createElement("video");
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;
        // Do NOT set crossOrigin for blob storage URLs — it causes canvas tainting

        setThumbnailProgress(5);
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject("Video load timed out after 15s"), 15000);
          video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
          video.onerror = () => { clearTimeout(timeout); reject("Failed to load video"); };
        });
        setThumbnailProgress(15);

        const duration = video.duration;
        const fractions = [0.1, 0.25, 0.5, 0.7, 0.9];
        const thumbs: string[] = [];

        for (let i = 0; i < fractions.length; i++) {
          const frac = fractions[i];
          video.currentTime = duration * frac;
          await new Promise<void>((resolve) => {
            const seekTimeout = setTimeout(resolve, 5000); // don't hang forever
            video.onseeked = () => { clearTimeout(seekTimeout); resolve(); };
          });
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            thumbs.push(canvas.toDataURL("image/jpeg", 0.95));
          } catch {
            // Canvas tainted — skip this frame
            console.warn("Canvas tainted, skipping frame at", frac);
          }
          // Update progress: 15% for loading + 85% spread across frames
          setThumbnailProgress(Math.round(15 + ((i + 1) / fractions.length) * 85));
        }
        
        if (thumbs.length > 0) {
          setThumbnailSuggestions(thumbs);
          showMessage(`${thumbs.length} thumbnails generated`);
        } else {
          showMessage("Could not extract frames — try uploading a custom cover instead", "error");
        }
      }
    } catch (e) {
      console.error(e);
      showMessage(typeof e === 'string' ? e : "Error generating thumbnails", "error");
    } finally {
      setIsGeneratingThumbs(false);
      setThumbnailProgress(0);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uniqueName = `${Date.now()}-${file.name}`;
      const newBlob = await upload(uniqueName, file, {
        access: 'public',
        handleUploadUrl: `/api/upload?password=${encodeURIComponent(password)}`,
      });
      if (newBlob.url) {
        setNewProject(prev => ({ ...prev, thumbnail_url: newBlob.url }));
        setThumbnailSuggestions(prev => [newBlob.url, ...prev]);
        showMessage("Custom thumbnail uploaded");
      }
    } catch (error: any) {
      showMessage(error.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const removeThumbnailCandidate = (url: string) => {
    setThumbnailSuggestions(prev => prev.filter(t => t !== url));
    if (newProject.thumbnail_url === url) {
      setNewProject(prev => ({ ...prev, thumbnail_url: "" }));
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
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': password 
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': password 
        },
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
          <div className="w-full max-w-3xl h-full bg-[var(--color-brand-bg)] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-8 md:px-12 md:py-8 border-b border-black/5 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-display italic leading-none">{editingProjectId ? "Edit Project" : "Create Project"}</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-2">Step {formTab === 'basic' ? '1' : formTab === 'media' ? '2' : formTab === 'narrative' ? '3' : '4'} of 4</p>
              </div>
              <button onClick={() => { setIsProjectFormOpen(false); setEditingProjectId(null); }} className="text-gray-400 hover:text-black transition-colors">
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-black/5 px-8 md:px-12 bg-white/30">
              {[
                { id: 'basic', label: 'Details' },
                { id: 'media', label: 'Video & Cover' },
                { id: 'narrative', label: 'Story & Awards' },
                { id: 'gallery', label: 'Gallery' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormTab(tab.id as any)}
                  className={`py-4 px-6 text-[10px] uppercase tracking-widest font-bold transition-all border-b-2 ${
                    formTab === tab.id 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={editingProjectId ? handleUpdateProject : handleCreateProject} className="flex-1 overflow-y-auto p-8 md:p-12 flex flex-col gap-12">
              
              {/* Tab 1: Basic & Professional Details */}
              {formTab === 'basic' && (
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400">Project Title</label>
                      <input 
                        required
                        value={newProject.title}
                        onChange={e => setNewProject({...newProject, title: e.target.value})}
                        className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium text-lg"
                        placeholder="Midnight Motion"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400">Category</label>
                      <select 
                        value={newProject.category}
                        onChange={e => setNewProject({...newProject, category: e.target.value})}
                        className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2.5 font-medium appearance-none"
                      >
                        <option value="COMMERCIAL">Commercials</option>
                        <option value="MUSIC_VIDEO">Music Videos</option>
                        <option value="NARRATIVE">Narrative</option>
                        <option value="DOCUMENTARY">Documentaries</option>
                        <option value="FASHION">Fashion</option>
                        <option value="STILLS">Stills</option>
                        <option value="FEATURED">Featured (Private)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400">Release Year</label>
                      <input 
                        required
                        value={newProject.year}
                        onChange={e => setNewProject({...newProject, year: e.target.value})}
                        className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400">Sort Order</label>
                      <input 
                        type="number"
                        value={newProject.sort_order}
                        onChange={e => setNewProject({...newProject, sort_order: parseInt(e.target.value) || 0})}
                        className="bg-transparent border-b border-black/10 focus:border-black outline-none py-2 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-black/5">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/20 mb-8">Professional Credits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400">Your Role</label>
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
                  </div>
                </div>
              )}

              {/* Tab 2: Media & Cover Selection */}
              {formTab === 'media' && (
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex flex-col gap-6 p-6 bg-black/5 rounded-lg border border-black/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Project Media Source</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleFetchVimeoMeta}
                          disabled={isFetchingMeta || !newProject.media_url.includes('vimeo.com')}
                          className="text-[9px] uppercase font-bold text-gray-500 hover:text-black disabled:opacity-30 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm"
                        >
                          {isFetchingMeta ? "FETCHING..." : "FETCH DATA"}
                          {!isFetchingMeta && <LinkIcon size={10} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => generateThumbnails(newProject.media_url)}
                          disabled={isGeneratingThumbs || !newProject.media_url || newProject.media_url.includes('vimeo.com')}
                          className="text-[9px] uppercase font-bold text-gray-500 hover:text-black disabled:opacity-30 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm"
                        >
                          {isGeneratingThumbs ? `PROCESSED ${thumbnailProgress}%` : "EXTRACT COVERS"}
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input 
                        required
                        value={newProject.media_url}
                        onChange={e => setNewProject({...newProject, media_url: e.target.value})}
                        className="w-full bg-white border border-black/10 focus:border-black outline-none p-4 rounded-md font-medium text-sm shadow-inner"
                        placeholder="Paste Vimeo link or direct video URL..."
                      />
                    </div>
                    
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] text-gray-400 italic">MP4, WebM, MOV, HLS or Vimeo URLs are supported.</p>
                      <label className="cursor-pointer group">
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-black transition-colors flex items-center gap-2">
                          {isUploading ? `UPLOADING ${uploadProgress}%` : "OR UPLOAD VIDEO FILE"}
                          {!isUploading && <UploadIcon size={12} />}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Project Thumbnail / Cover Selection</label>
                    <div className="relative group/scroll">
                      {/* Scroll Arrows */}
                      <button 
                        type="button"
                        onClick={() => scrollThumbnails('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-black -left-4 shadow-lg"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => scrollThumbnails('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-black -right-4 shadow-lg"
                      >
                        <ChevronRight size={20} />
                      </button>

                      <div 
                        ref={thumbnailScrollRef}
                        className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent py-4 px-1 scroll-smooth"
                      >
                        {[
                          newProject.media_url && !newProject.media_url.includes('vimeo.com') ? newProject.media_url : null,
                          newProject.thumbnail_url && newProject.thumbnail_url.includes('vimeocdn.com') ? newProject.thumbnail_url : null,
                          ...thumbnailSuggestions,
                          ...newProject.gallery
                        ].filter(Boolean).map((url, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setNewProject(prev => ({ ...prev, thumbnail_url: url as string }))}
                            className={`group min-w-[200px] aspect-video relative cursor-pointer border-4 transition-all rounded overflow-hidden shadow-sm hover:shadow-md ${
                              newProject.thumbnail_url === url 
                                ? 'border-black scale-[1.02]' 
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={url as string} alt="" className="w-full h-full object-cover" />
                            
                            {thumbnailSuggestions.includes(url as string) && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeThumbnailCandidate(url as string);
                                }}
                                className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                              >
                                <X size={12} />
                              </button>
                            )}

                            {newProject.thumbnail_url === url && (
                              <div className="absolute inset-x-0 bottom-0 bg-black text-white py-1.5 text-[8px] uppercase tracking-[0.3em] font-bold text-center">Selected Cover</div>
                            )}
                          </div>
                        ))}
                        
                        <label className="min-w-[200px] aspect-video flex flex-col items-center justify-center border-2 border-dashed border-black/10 hover:border-black/30 bg-black/5 cursor-pointer transition-all rounded group">
                          <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploading} />
                          <UploadIcon size={24} className="text-gray-300 group-hover:text-black mb-2 transition-colors" />
                          <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 group-hover:text-black">Upload Custom Cover</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Narrative & Awards */}
              {formTab === 'narrative' && (
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Awards & Festivals</label>
                    <input 
                      value={newProject.awards}
                      onChange={e => setNewProject({...newProject, awards: e.target.value})}
                      className="bg-transparent border-b border-black/10 focus:border-black outline-none py-3 font-medium text-base italic"
                      placeholder="e.g. Winner — Best Cinematography, Cannes 2024"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Short Project Overview</label>
                    <textarea 
                      rows={3}
                      value={newProject.description}
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                      className="bg-white border border-black/10 focus:border-black outline-none p-4 rounded-md font-light text-sm shadow-sm leading-relaxed"
                      placeholder="Brief context for the homepage grid..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Detailed Narrative Story</label>
                    <textarea 
                      rows={8}
                      value={newProject.long_description}
                      onChange={e => setNewProject({...newProject, long_description: e.target.value})}
                      className="bg-white border border-black/10 focus:border-black outline-none p-4 rounded-md font-light text-sm shadow-sm leading-relaxed"
                      placeholder="The full story, creative process, or technical details for the expanded view..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Behind the Frames (Gallery) */}
              {formTab === 'gallery' && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex justify-between items-center p-6 bg-black text-white rounded-lg">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest opacity-60 mb-1 font-bold">Behind the Frames</h4>
                      <p className="text-sm italic font-display">{newProject.gallery.length} Images Uploaded</p>
                    </div>
                    <label className="cursor-pointer bg-white text-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                      <input 
                        type="file" 
                        multiple
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, true)}
                        disabled={isUploading}
                      />
                      {isUploading ? `UPLOADING ${uploadProgress}%` : "Add Pictures"}
                      {!isUploading && <Plus size={14} />}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {newProject.gallery.map((url, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 relative group rounded-lg overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-all">
                        <img src={url} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                        <button 
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-2 right-2 bg-black text-white p-2 rounded-full translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {newProject.gallery.length === 0 && (
                      <div className="col-span-full py-20 border-2 border-dashed border-black/10 rounded-xl flex flex-col items-center justify-center text-gray-300 gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-black/5 flex items-center justify-center">
                          <Plus size={32} className="opacity-20" />
                        </div>
                        <p className="text-xs italic uppercase tracking-widest font-bold opacity-30">No gallery images added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sticky Footer in Form */}
              <div className="mt-auto pt-10 border-t border-black/5 flex items-center justify-between sticky bottom-0 bg-[var(--color-brand-bg)] py-4">
                <div className="flex gap-4">
                  {formTab !== 'basic' && (
                    <button 
                      type="button"
                      onClick={() => setFormTab(formTab === 'media' ? 'basic' : formTab === 'narrative' ? 'media' : 'narrative')}
                      className="px-8 py-3 border border-black/10 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-black/5 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {formTab !== 'gallery' && (
                    <button 
                      type="button"
                      onClick={() => setFormTab(formTab === 'basic' ? 'media' : formTab === 'media' ? 'narrative' : 'gallery')}
                      className="px-8 py-3 bg-black text-white rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors"
                    >
                      Next Step
                    </button>
                  )}
                </div>
                
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`px-12 py-3 rounded-full uppercase tracking-[0.2em] text-[10px] font-bold transition-all ${
                    isLoading ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {isLoading ? "Saving..." : (editingProjectId ? "Save Changes" : "Publish Project")}
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
