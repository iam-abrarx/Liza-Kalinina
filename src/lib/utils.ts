export const CATEGORIES = [
  "Commercials",
  "Music Videos",
  "Narrative",
  "Documentaries",
  "Photography",
  "Films",
];

export const CATEGORY_MAP: Record<string, string> = {
  "Commercials": "COMMERCIAL",
  "Music Videos": "MUSIC_VIDEO",
  "Narrative": "NARRATIVE",
  "Documentaries": "DOCUMENTARY",
  "Fashion": "FASHION",
  "Photography": "STILLS",
  "Films": "FEATURED"
};

export const getVimeoId = (url: string | null) => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

export const getMediaUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  
  // Consistency check: Ensure local paths start with /
  const cleanUrl = url.replace(/^\/Elizabeth-Kalinina/, '');
  return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
};

export const isVideo = (url: string | null) => {
  if (!url) return false;
  return url.match(/\.(mp4|webm|ogg|mov)$|^blob:|^data:video/i) !== null;
};
