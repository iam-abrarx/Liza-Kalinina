import { useState } from 'react';

export function useThumbnailGenerator() {
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<string[]>([]);

  const fetchVimeoMeta = async (url: string) => {
    setIsFetchingMeta(true);
    try {
      const urlsToTry: string[] = [url];
      const unlistedMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
      if (unlistedMatch) {
        urlsToTry.push(`https://vimeo.com/${unlistedMatch[1]}/${unlistedMatch[2]}`);
        urlsToTry.push(`https://vimeo.com/${unlistedMatch[1]}`);
      }

      const uniqueUrls = [...new Set(urlsToTry)];
      let data: any = null;

      for (const tryUrl of uniqueUrls) {
        try {
          const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(tryUrl)}`);
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch { /* try next */ }
      }

      if (!data) {
        throw new Error("Could not fetch details. This video may be password-protected or private.");
      }

      return data;
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const generateThumbnails = async (videoUrl: string, onDefaultSelected?: (url: string) => void) => {
    setIsGeneratingThumbs(true);
    setThumbnailProgress(0);
    setThumbnailSuggestions([]);
    
    try {
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vimeoMatch) {
        const vimeoId = vimeoMatch[1];
        const thumbs: string[] = [];
        setThumbnailProgress(20);
        const sizes = ['', '_large'];
        for (const size of sizes) {
          thumbs.push(`https://vumbnail.com/${vimeoId}${size}.jpg`);
        }
        setThumbnailProgress(50);
        
        try {
          const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url) {
              const hiRes = data.thumbnail_url.replace(/_\d+x\d+/, '');
              const midRes = data.thumbnail_url.replace(/_\d+x\d+/, '_1280x720');
              thumbs.unshift(hiRes, midRes);
            }
          }
        } catch { /* ignore fetch errors */ }

        setThumbnailProgress(90);
        const unique = [...new Set(thumbs)];
        setThumbnailSuggestions(unique);
        setThumbnailProgress(100);
        return { unique, type: 'vimeo' };
      } else {
        const video = document.createElement("video");
        if (!videoUrl.startsWith('blob:')) {
          video.crossOrigin = "anonymous";
        }
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

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
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            };
            video.addEventListener('seeked', onSeeked);
            setTimeout(resolve, 3000);
          });

          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          
          try {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            thumbs.push(dataUrl);
            
            if (i === 1 && onDefaultSelected) {
              onDefaultSelected(dataUrl);
            }
          } catch (e) {
            console.warn("Frame extraction failed for", videoUrl, e);
          }
          
          setThumbnailProgress(Math.round(15 + ((i + 1) / fractions.length) * 85));
        }
        
        if (thumbs.length > 0) {
          setThumbnailSuggestions(thumbs);
          return { unique: thumbs, type: 'frame' };
        } else {
          throw new Error("Could not extract frames — try uploading a custom cover instead");
        }
      }
    } finally {
      setIsGeneratingThumbs(false);
      setThumbnailProgress(0);
    }
  };

  const removeThumbnailCandidate = (urlToRemove: string) => {
    setThumbnailSuggestions(prev => prev.filter(url => url !== urlToRemove));
  };

  const addThumbnailCandidate = (url: string) => {
    setThumbnailSuggestions(prev => [url, ...prev]);
  };

  return {
    isFetchingMeta,
    isGeneratingThumbs,
    thumbnailProgress,
    thumbnailSuggestions,
    fetchVimeoMeta,
    generateThumbnails,
    removeThumbnailCandidate,
    addThumbnailCandidate,
    setThumbnailSuggestions
  };
}
