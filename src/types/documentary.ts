export interface Documentary {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number; // en minutes
  director: string;
  year: number;
  category: string;
  tags: string[];
  view_count: number;
  created_at: string;
}