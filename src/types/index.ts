export type Category = 
  | "COMMERCIAL" 
  | "MUSIC_VIDEO" 
  | "NARRATIVE" 
  | "DOCUMENTARY" 
  | "FASHION" 
  | "STILLS" 
  | "FEATURED";

export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  media_url: string;
  thumbnail_url: string | null;
  role: string | null;
  director: string | null;
  client: string | null;
  production_company: string | null;
  awards: string | null;
  description: string | null;
  long_description: string | null;
  gallery: string[];
  is_public: boolean;
  is_locked?: boolean;
  sort_order?: number;
  createdAt: Date;
}

export type ViewMode = 'editorial' | 'theatrical';
