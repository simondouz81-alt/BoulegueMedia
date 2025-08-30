// src/types/event.ts

export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string; 
  location: string;
  latitude: number;
  longitude: number;
  category: 'festival' | 'concert' | 'exposition' | 'conference' | 'atelier' | 'autre';
  organizer: string;
  price?: number; 
  website_url?: string;
  contact_email?: string; 
  image_url?: string; 
  created_at: string;
  updated_at: string;
}
